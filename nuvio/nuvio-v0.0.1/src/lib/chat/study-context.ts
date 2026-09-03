import type { createClient } from "@/lib/supabase/server";
import { getStudyStage } from "../studies-utils.ts";
import { parseStoredAnalysis } from "../analysis/stored.ts";
import type { StudyAnalysis } from "../analysis/schema.ts";
import type { SelectableStudy } from "./schema.ts";
import { ChatError } from "./chat-db.ts";

export { ChatError };

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Fase 7.4 — Contexto de estudios para el Chat IA.
 *
 * Responsable de:
 * - Listar los estudios del usuario que están listos para usarse como contexto.
 * - Verificar ownership y disponibilidad (stage "ready") de un estudio.
 * - Construir el payload de contexto (análisis validado + texto extraído) que
 *   el chat service incluirá en el prompt.
 *
 * Reglas de seguridad:
 * - Solo se exponen estudios del usuario autenticado (filtro por user_id).
 * - Solo estudios con análisis completado (stage "ready").
 * - El contenido almacenado se re-valida con Zod antes de usarse.
 */

/** Máximo de caracteres de texto extraído por estudio incluido en el contexto. */
export const MAX_CONTEXT_EXTRACTION_CHARS = 20_000;

/**
 * Contexto de un estudio listo para el prompt del chat.
 */
export interface ChatStudyContext {
  studyId: string;
  fileName: string;
  studyType: string;
  analysis: StudyAnalysis;
  extractedText: string;
}

/**
 * Lista los estudios del usuario listos para usar como contexto
 * (documento procesado + análisis completado).
 */
export async function listSelectableStudiesCore(
  supabase: Supabase,
  userId: string
): Promise<SelectableStudy[]> {
  const { data, error } = await supabase
    .from("studies")
    .select("id, file_name, study_type, status, analysis_status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new ChatError("db_error", "Error al cargar los estudios.");
  }

  return ((data ?? []) as SelectableStudy[]).filter(
    (s) => getStudyStage(s.status, s.analysis_status) === "ready"
  );
}

/**
 * Verifica que un estudio pertenezca al usuario autenticado y esté en stage
 * "ready" (procesado + análisis completado). Lanza ChatError si no.
 */
export async function assertStudyReadyCore(
  supabase: Supabase,
  userId: string,
  studyId: string
): Promise<void> {
  const { data, error } = await supabase
    .from("studies")
    .select("status, analysis_status")
    .eq("id", studyId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new ChatError("db_error", "Error al validar el estudio.");
  }

  if (!data) {
    throw new ChatError(
      "study_not_found",
      "Estudio no encontrado o sin acceso."
    );
  }

  if (getStudyStage(data.status, data.analysis_status) !== "ready") {
    throw new ChatError(
      "study_not_ready",
      "El estudio todavía no está listo para usarse como contexto."
    );
  }
}

/**
 * Carga los estudios de contexto de una conversación y arma el payload
 * para el prompt (análisis validado + texto extraído recortado).
 *
 * @returns Lista de contextos; vacía si la conversación no tiene contexto.
 */
export async function loadContextForPromptCore(
  supabase: Supabase,
  userId: string,
  conversationId: string
): Promise<ChatStudyContext[]> {
  // 1) Vínculos de contexto de la conversación (ya filtrados por user_id).
  const { data: links, error: linksError } = await supabase
    .from("chat_contexts")
    .select("study_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (linksError) {
    throw new ChatError("db_error", "Error al cargar el contexto.");
  }

  const studyIds = (links ?? []).map((l) => l.study_id);
  if (studyIds.length === 0) return [];

  const contexts: ChatStudyContext[] = [];

  for (const studyId of studyIds) {
    // 2) Ownership + metadata del estudio.
    const { data: study, error: studyError } = await supabase
      .from("studies")
      .select("id, file_name, study_type, status, analysis_status")
      .eq("id", studyId)
      .eq("user_id", userId)
      .maybeSingle();

    if (studyError || !study) continue;
    if (getStudyStage(study.status, study.analysis_status) !== "ready") {
      continue;
    }

    // 3) Análisis validado (re-parse con Zod).
    const { data: analysisRow } = await supabase
      .from("study_analyses")
      .select("analysis")
      .eq("study_id", studyId)
      .eq("user_id", userId)
      .maybeSingle();

    const analysis = analysisRow?.analysis
      ? parseStoredAnalysis(analysisRow.analysis as Record<string, unknown>)
      : null;
    if (!analysis) continue;

    // 4) Texto extraído (recortado para acotar el tamaño del prompt).
    const { data: extractionRow } = await supabase
      .from("study_extractions")
      .select("extracted_text")
      .eq("study_id", studyId)
      .eq("user_id", userId)
      .maybeSingle();

    const extractedText = (extractionRow?.extracted_text as string | null) ?? "";
    const capped =
      extractedText.length > MAX_CONTEXT_EXTRACTION_CHARS
        ? extractedText.slice(0, MAX_CONTEXT_EXTRACTION_CHARS) +
          "\n…[contenido truncado]"
        : extractedText;

    contexts.push({
      studyId: study.id,
      fileName: study.file_name,
      studyType: study.study_type,
      analysis,
      extractedText: capped,
    });
  }

  return contexts;
}
