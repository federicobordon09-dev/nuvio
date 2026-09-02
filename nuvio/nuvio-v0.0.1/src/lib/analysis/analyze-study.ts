import { createClient } from "@/lib/supabase/server";
import { analyzeStudyText } from "./gemini.ts";
import { upsertStudyAnalysis } from "@/lib/actions/studies.ts";
import type { StudyAnalysis } from "./schema.ts";

type StudyRow = {
  id: string;
  user_id: string;
  status: string;
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

async function assertAuthenticated(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new AnalysisError(
      "unauthenticated",
      "No hay sesión activa. Iniciá sesión para continuar."
    );
  }
  return user;
}

/**
 * Pipeline server-side: extracted_text → Gemini → Zod → study_analyses.
 *
 * No modifica study_extractions ni MuPDF.
 * No se ejecuta automáticamente (se llama explícitamente).
 */
export async function analyzeStudy(
  studyId: string
): Promise<StudyAnalysis> {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);

  // ── Paso B: obtener el estudio ──────────────────────────────
  const { data: study, error: studyError } = await supabase
    .from("studies")
    .select("id, user_id, status")
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

  // ── Paso D: llamar a Gemini ─────────────────────────────────
  let analysis: StudyAnalysis;
  try {
    analysis = await analyzeStudyText(targetExtraction.extracted_text);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error desconocido de Gemini";
    console.error(
      `[nuvio:analyze-study] Gemini failed for study=${studyId}: ${message}`
    );
    throw new AnalysisError("gemini_failed", "El análisis con IA falló.");
  }

  // ── Paso E: persistir ───────────────────────────────────────
  try {
    await upsertStudyAnalysis(studyId, analysis as Record<string, unknown>);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error desconocido de persistencia";
    console.error(
      `[nuvio:analyze-study] Persist failed for study=${studyId}: ${message}`
    );
    throw new AnalysisError(
      "persist_failed",
      "El análisis se generó pero no se pudo guardar."
    );
  }

  return analysis;
}
