"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { processStudy } from "@/lib/studies/processing";
import { analyzeStudy, AnalysisError } from "@/lib/analysis/analyze-study";
import { getAnalysisErrorMessage } from "@/lib/analysis/errors";
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES, type StudyType, computeStudyStats, type StudyStats } from "@/lib/studies-utils";
import { deleteStudyCore, countStudiesCore } from "@/lib/studies/study-ops";
import { cleanupEmptyConversationsCore } from "@/lib/chat/chat-db";

async function assertAuthenticated(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}

export async function listStudies() {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);

  const { data, error } = await supabase
    .from("studies")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Error al cargar estudios: ${error.message}`);
  }

  return (data ?? []) as Array<{
    id: string;
    user_id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    study_type: StudyType | null;
    status: string;
    processing_error: string | null;
    analysis_status: string;
    analysis_error: string | null;
    created_at: string;
    updated_at: string;
  }>;
}

export async function getStudy(studyId: string) {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);

  const { data, error } = await supabase
    .from("studies")
    .select("*")
    .eq("id", studyId)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    throw new Error("Estudio no encontrado o sin acceso");
  }

  return data;
}

export async function getStudyExtraction(studyId: string) {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);

  const { data, error } = await supabase
    .from("study_extractions")
    .select("extracted_text, page_count, method")
    .eq("study_id", studyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("Error al cargar la extracción del estudio.");
  }

  return data;
}

export async function uploadStudy(formData: FormData) {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);

  const file = formData.get("file") as File | null;

  if (!file || file.size === 0) {
    throw new Error("Debés seleccionar un archivo.");
  }

  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    throw new Error(
      "Tipo de archivo no permitido. Permitidos: PDF, JPEG, PNG, WebP."
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`El archivo supera el tamaño máximo de ${MAX_FILE_SIZE / (1024 * 1024)} MB.`);
  }

  const studyId = crypto.randomUUID();
  const fileName = file.name;
  const filePath = `${user.id}/${studyId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("medical-studies")
    .upload(filePath, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Error al subir el archivo: ${uploadError.message}`);
  }

  const { error: dbError } = await supabase.from("studies").insert({
    id: studyId,
    user_id: user.id,
    file_name: fileName,
    file_path: filePath,
    file_size: file.size,
    mime_type: file.type,
    study_type: null,
    status: "uploaded",
  });

  if (dbError) {
    try {
      await supabase.storage.from("medical-studies").remove([filePath]);
    } catch {
      // Intento de limpieza ante fallo; el error principal se propaga igualmente.
    }
    throw new Error(`Error al guardar el estudio: ${dbError.message}`);
  }

  revalidatePath("/dashboard/estudios");
  redirect(`/dashboard/estudios/${studyId}`);
}

export async function getSignedUrl(studyId: string) {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);

  const { data: study, error: fetchError } = await supabase
    .from("studies")
    .select("file_path, user_id")
    .eq("id", studyId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !study) {
    throw new Error("Estudio no encontrado o sin acceso");
  }

  const { data, error: urlError } = await supabase.storage
    .from("medical-studies")
    .createSignedUrl(study.file_path, 60);

  if (urlError) {
    throw new Error(`Error al generar enlace temporal: ${urlError.message}`);
  }

  return data.signedUrl;
}

export async function deleteStudy(studyId: string) {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);
  await deleteStudyCore(studyId, { supabase });

  // Limpiar conversaciones que quedaron vacías (0 contextos + 0 mensajes)
  // después de que CASCADE eliminó los chat_contexts del estudio borrado.
  try {
    await cleanupEmptyConversationsCore(supabase, user.id);
  } catch {
    // La limpieza no es crítica: si falla, la conversación queda vacía pero
    // no rota. No bloqueamos el borrado del estudio.
  }

  revalidatePath("/dashboard/estudios");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/chat");
  redirect("/dashboard/estudios");
}

/**
 * Devuelve la cantidad total de estudios del usuario autenticado.
 * Se usa en el dashboard para mostrar el conteo real.
 */
export async function getStudyCount(): Promise<number> {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);
  return countStudiesCore(supabase, user.id);
}

/**
 * Resumen de estudios del usuario por stage combinado (documento + análisis).
 * Se usa en el dashboard para mostrar los conteos reales por estado.
 */
export async function getStudyStats(): Promise<StudyStats> {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);

  const { data, error } = await supabase
    .from("studies")
    .select("status, analysis_status")
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Error al cargar el resumen de estudios: ${error.message}`);
  }

  return computeStudyStats(
    (data ?? []) as Array<{ status: string; analysis_status: string | null }>
  );
}

export async function deleteStudyAction(formData: FormData) {
  const studyId = formData.get("studyId");
  if (typeof studyId !== "string") {
    throw new Error("ID de estudio inválido.");
  }
  await deleteStudy(studyId);
}

function getStudyIdFromForm(formData: FormData): string {
  const studyId = formData.get("studyId");
  if (typeof studyId !== "string" || !studyId) {
    throw new Error("ID de estudio inválido.");
  }
  return studyId;
}

/**
 * Procesa el documento de un estudio SIN redirect.
 * Usado por el pipeline automático (StudyPipelineController) y por
 * processStudyAction (botón manual).
 */
export async function processStudyAuto(
  studyId: string
): Promise<{ status: string; processing_error: string | null }> {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);

  await processStudy(supabase, user.id, studyId);

  revalidatePath(`/dashboard/estudios/${studyId}`);

  const { data } = await supabase
    .from("studies")
    .select("status, processing_error")
    .eq("id", studyId)
    .eq("user_id", user.id)
    .single();

  return data as { status: string; processing_error: string | null };
}

/**
 * Procesamiento manual desde botón: reutiliza processStudyAuto + redirect.
 */
export async function processStudyAction(formData: FormData) {
  const studyId = getStudyIdFromForm(formData);
  await processStudyAuto(studyId);

  revalidatePath("/dashboard/estudios");
  redirect(`/dashboard/estudios/${studyId}`);
}

// ── study_analyses ────────────────────────────────────────────

export type StudyAnalysisRow = {
  id: string;
  study_id: string;
  user_id: string;
  analysis: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export async function getStudyAnalysis(
  studyId: string
): Promise<StudyAnalysisRow | null> {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);

  const { data, error } = await supabase
    .from("study_analyses")
    .select("id, study_id, user_id, analysis, created_at, updated_at")
    .eq("study_id", studyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("Error al cargar el análisis del estudio.");
  }

  return data as StudyAnalysisRow | null;
}

export async function upsertStudyAnalysis(
  studyId: string,
  analysis: Record<string, unknown>
): Promise<StudyAnalysisRow> {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);

  const { data, error } = await supabase
    .from("study_analyses")
    .upsert(
      {
        study_id: studyId,
        user_id: user.id,
        analysis,
      },
      { onConflict: "study_id" }
    )
    .select("id, study_id, user_id, analysis, created_at, updated_at")
    .single();

  if (error) {
    throw new Error("Error al guardar el análisis del estudio.");
  }

  return data as StudyAnalysisRow;
}

// ── analyzeStudy (manual) ───────────────────────────────────────

export type AnalyzeStudyResult =
  | { success: true; analysis: Record<string, unknown> }
  | { success: false; error: string };

/**
 * Ejecuta manualmente el análisis de IA sobre un estudio ya procesado.
 *
 * Reutiliza el pipeline existente `analyzeStudy(studyId)` que ya maneja:
 * - autenticación + ownership
 * - verificación de estado `processed`
 * - obtención de extracción
 * - llamada a Gemini + validación Zod
 * - persistencia idempotente (upsert por study_id)
 *
 * Devuelve éxito con el análisis generado, o error con mensaje controlado.
 */
export async function requestStudyAnalysis(
  studyId: string
): Promise<AnalyzeStudyResult> {
  try {
    const analysis = await analyzeStudy(studyId);
    revalidatePath(`/dashboard/estudios/${studyId}`);
    revalidatePath("/dashboard/estudios");
    return { success: true, analysis: analysis as Record<string, unknown> };
  } catch (err) {
    if (err instanceof AnalysisError) {
      return { success: false, error: getAnalysisErrorMessage(err.code) };
    }
    console.error("[nuvio:requestStudyAnalysis] Unexpected error:", err);
    return { success: false, error: "No pudimos analizar este estudio." };
  }
}