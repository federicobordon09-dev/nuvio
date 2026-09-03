import type { createClient } from "@/lib/supabase/server";
import { analyzeStudyText, GeminiError, type GeminiErrorType } from "./gemini.ts";
import type { StudyAnalysis } from "./schema.ts";

type Supabase = Awaited<ReturnType<typeof createClient>>;

type StudyRow = {
  id: string;
  user_id: string;
  status: string;
  analysis_status: string;
};

type ExtractionRow = {
  extracted_text: string;
  page_count: number | null;
  method: string;
};

export class AnalysisError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AnalysisError";
    this.code = code;
  }
}

// ── Retry para errores transitorios de Gemini ────────────────────

/**
 * Errores de Gemini que justifican un reintento automático.
 *
 * - `gemini_timeout`: la request excedió el timeout (puede ser saturación).
 * - `gemini_network`: errores de red transitorios (ECONNRESET, ECONNREFUSED, etc.).
 * - `gemini_api_error` con HTTP 503: servicio temporalmente no disponible (alta demanda).
 * - `gemini_api_error` con HTTP 429: rate limit excedido.
 *
 * NO se reintentan:
 * - `gemini_invalid_response`: error de schema/JSON (permanente).
 * - `gemini_api_error` con 400/401/403/404: errores permanentes del cliente.
 */
const RETRYABLE_ERROR_TYPES: Set<GeminiErrorType> = new Set([
  "gemini_timeout",
  "gemini_network",
]);

const RETRYABLE_HTTP_STATUSES: Set<number> = new Set([429, 503]);

export function isTransientGeminiError(err: unknown): boolean {
  if (!(err instanceof GeminiError)) return false;

  // Timeout y red siempre son transitorios.
  if (RETRYABLE_ERROR_TYPES.has(err.type)) return true;

  // Para errores de API, inspeccionar el status HTTP del error original.
  if (err.type === "gemini_api_error" && err.cause instanceof Error) {
    const cause = err.cause;
    if ("status" in cause && typeof cause.status === "number") {
      return RETRYABLE_HTTP_STATUSES.has(cause.status);
    }
  }

  return false;
}

/** Delay base en ms para el primer reintento. */
const BASE_DELAY_MS = 1_000;
/** Número máximo de intentos (1 inicial + reintentos). */
const MAX_ATTEMPTS = 3;

/**
 * Envuelve una función de análisis con retry para errores transitorios.
 *
 * Exponential backoff con jitter: delay = min(base * 2^attempt, 8000) + jitter.
 * - Intento 1: ~1-2s de delay (si falla)
 * - Intento 2: ~2-4s de delay (si falla)
 * - Intento 3: falla definitiva
 *
 * No reintent errores permanentes (schema, auth, validación).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: { maxAttempts?: number }
): Promise<T> {
  const maxAttempts = opts?.maxAttempts ?? MAX_ATTEMPTS;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt >= maxAttempts || !isTransientGeminiError(err)) {
        throw err;
      }

      // Exponential backoff con jitter: base * 2^(attempt-1) + random(0, base)
      const delay = Math.min(
        BASE_DELAY_MS * Math.pow(2, attempt - 1),
        8_000
      );
      const jitter = Math.random() * BASE_DELAY_MS;
      const waitMs = Math.round(delay + jitter);

      console.warn(
        `[nuvio:analyze-study] Transient error on attempt ${attempt}/${maxAttempts}, retrying in ${waitMs}ms: ${(err as Error).message}`
      );

      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  throw lastError;
}

// ── Núcleo testable (deps inyectadas) ─────────────────────────

/**
 * Pipeline server-side completo: extracted_text → Gemini → Zod → study_analyses.
 *
 * - Claim atómico: setea `analysis_status = 'processing'` solo si no está ya
 *   en curso (evita llamadas duplicadas a Gemini).
 * - On success: upsert + `analysis_status = 'completed'`.
 * - On failure: `analysis_status = 'failed'`, `analysis_error = <código>`.
 * - No modifica study_extractions ni MuPDF.
 *
 * @param supabase Cliente Supabase autenticado (o doble de prueba).
 * @param analyzeText Función que ejecuta Gemini y devuelve StudyAnalysis.
 * @param upsertAnalysis Función que persiste el análisis (upsert por study_id).
 */
export async function analyzeStudyWithDeps(
  studyId: string,
  deps: {
    supabase: Supabase;
    analyzeText: (text: string) => Promise<StudyAnalysis>;
    upsertAnalysis: (
      studyId: string,
      data: Record<string, unknown>
    ) => Promise<void>;
  }
): Promise<StudyAnalysis> {
  const { supabase, analyzeText, upsertAnalysis } = deps;

  // ── Paso A: autenticación ──────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new AnalysisError(
      "unauthenticated",
      "No hay sesión activa. Iniciá sesión para continuar."
    );
  }

  // ── Paso B: obtener el estudio ──────────────────────────────
  const { data: study, error: studyError } = await supabase
    .from("studies")
    .select("id, user_id, status, analysis_status")
    .eq("id", studyId)
    .eq("user_id", user.id)
    .single();

  if (studyError || !study) {
    throw new AnalysisError(
      "study_not_found",
      "Estudio no encontrado o sin acceso."
    );
  }

  const target = study as unknown as StudyRow;

  if (target.status !== "processed") {
    throw new AnalysisError(
      "study_not_ready",
      `El estudio tiene estado "${target.status}". Solamente se pueden analizar estudios procesados.`
    );
  }

  // ── Paso C: obtener la extracción ───────────────────────────
  const { data: extraction, error: extractionError } = await supabase
    .from("study_extractions")
    .select("extracted_text, page_count, method")
    .eq("study_id", studyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (extractionError) {
    throw new AnalysisError(
      "extraction_error",
      "Error al consultar la extracción del estudio."
    );
  }

  if (!extraction) {
    throw new AnalysisError(
      "extraction_missing",
      "El estudio no tiene contenido extraído."
    );
  }

  const targetExtraction = extraction as unknown as ExtractionRow;

  if (!targetExtraction.extracted_text?.trim()) {
    throw new AnalysisError(
      "extraction_empty",
      "El texto extraído está vacío. No hay contenido suficiente para analizar."
    );
  }

  // ── Paso D: claim atómico ───────────────────────────────────
  // Solo un proceso puede reclamar a la vez. Neq('processing') garantiza
  // atomicidad a nivel de fila: si otro proceso ya está en curso, devuelve 0
  // filas y no llamamos a Gemini.
  const { data: claimed } = await supabase
    .from("studies")
    .update({ analysis_status: "processing", analysis_error: null })
    .eq("id", studyId)
    .eq("user_id", user.id)
    .neq("analysis_status", "processing")
    .select("id");

  if (!claimed || claimed.length === 0) {
    throw new AnalysisError(
      "analysis_in_progress",
      "El análisis ya está en curso. Esperá unos segundos."
    );
  }

  // ── Paso E: llamar a Gemini (con retry para errores transitorios) ──
  let analysis: StudyAnalysis;
  try {
    analysis = await withRetry(() =>
      analyzeText(targetExtraction.extracted_text)
    );
  } catch (err) {
    // Marcar como fallido sin persistir análisis inválido.
    const code =
      err instanceof GeminiError ? err.type : "gemini_failed";
    await supabase
      .from("studies")
      .update({ analysis_status: "failed", analysis_error: code })
      .eq("id", studyId)
      .eq("user_id", user.id);

    if (err instanceof GeminiError) {
      console.error(
        `[nuvio:analyze-study] Gemini ${err.type} for study=${studyId}: ${err.message}`
      );
      throw new AnalysisError(
        err.type,
        `Gemini ${err.type}: ${err.message}`
      );
    }
    const message =
      err instanceof Error ? err.message : "Error desconocido de Gemini";
    console.error(
      `[nuvio:analyze-study] Gemini failed for study=${studyId}: ${message}`
    );
    throw new AnalysisError("gemini_failed", "El análisis con IA falló.");
  }

  // ── Paso F: persistir ───────────────────────────────────────
  try {
    await upsertAnalysis(studyId, analysis as Record<string, unknown>);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error desconocido de persistencia";
    console.error(
      `[nuvio:analyze-study] Persist failed for study=${studyId}: ${message}`
    );
    await supabase
      .from("studies")
      .update({
        analysis_status: "failed",
        analysis_error: "persist_failed",
      })
      .eq("id", studyId)
      .eq("user_id", user.id);
    throw new AnalysisError(
      "persist_failed",
      "El análisis se generó pero no se pudo guardar."
    );
  }

  // ── Paso G: marcar completado + persistir study_type ──────────
  await supabase
    .from("studies")
    .update({
      analysis_status: "completed",
      analysis_error: null,
      study_type: analysis.study_type,
    })
    .eq("id", studyId)
    .eq("user_id", user.id);

  return analysis;
}

// ── Entrada pública (cablea deps reales) ─────────────────────

/**
 * Wrapper público: crea cliente Supabase real y llama al núcleo con las
 * dependencias reales (analyzeStudyText + upsertStudyAnalysis).
 */
export async function analyzeStudy(
  studyId: string
): Promise<StudyAnalysis> {
  // Import dinámico (lazy): tanto `createClient` como `upsertStudyAnalysis`
  // viven en módulos que usan el alias `@/`, no resolvible por el runner de
  // tests (node:test). Al cargarlos bajo demanda, analyze-study.ts se puede
  // importar en tests (para `analyzeStudyWithDeps`) sin arrastrar Supabase
  // ni las server actions. Solo se resuelven en runtime real.
  const { createClient } = await import("@/lib/supabase/server");
  const { upsertStudyAnalysis } = await import("@/lib/actions/studies.ts");
  const supabase = await createClient();
  return analyzeStudyWithDeps(studyId, {
    supabase,
    analyzeText: analyzeStudyText,
    upsertAnalysis: async (id, data) => {
      await upsertStudyAnalysis(id, data);
    },
  });
}
