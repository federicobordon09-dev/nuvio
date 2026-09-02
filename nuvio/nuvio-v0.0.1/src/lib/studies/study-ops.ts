import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// ── Errores tipados ───────────────────────────────────────────

export class StudyDeleteError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "StudyDeleteError";
    this.code = code;
  }
}

// ── Núcleo testable (deps inyectadas) ─────────────────────────

/**
 * Elimina un estudio: storage + DB (con CASCADE a study_extractions y study_analyses).
 *
 * - Verifica ownership antes de borrar.
 * - Si falla Storage pero el archivo no existe → no es error (ya borrado).
 * - Si falla Storage con otro error → aborta antes de tocar la DB.
 * - Si falla DB después de borrar Storage → error documentado (estudio sin archivo).
 *
 * @param studyId ID del estudio a eliminar.
 * @param deps    Objeto con el cliente Supabase autenticado (o doble de prueba).
 */
export async function deleteStudyCore(
  studyId: string,
  deps: { supabase: Supabase }
): Promise<void> {
  const { supabase } = deps;

  // ── Auth ──────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new StudyDeleteError(
      "unauthenticated",
      "Iniciá sesión para continuar."
    );
  }

  // ── Ownership ─────────────────────────────────────────────────
  const { data: study, error: fetchError } = await supabase
    .from("studies")
    .select("file_path, user_id")
    .eq("id", studyId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !study) {
    throw new StudyDeleteError(
      "not_found",
      "Estudio no encontrado o sin acceso."
    );
  }

  // ── Storage removal ───────────────────────────────────────────
  const { error: storageError } = await supabase.storage
    .from("medical-studies")
    .remove([study.file_path]);

  if (storageError) {
    const msg = storageError.message?.toLowerCase() ?? "";
    // Si el archivo no existe (ya borrado), no es error fatal — no hay riesgo de huérfanos.
    if (!msg.includes("not found") && !msg.includes("no such object")) {
      throw new StudyDeleteError(
        "storage_failed",
        "No pudimos eliminar el archivo del estudio. Intentá de nuevo."
      );
    }
  }

  // ── DB delete (ON DELETE CASCADE limpia study_extractions + study_analyses) ──
  const { error: dbError } = await supabase
    .from("studies")
    .delete()
    .eq("id", studyId)
    .eq("user_id", user.id);

  if (dbError) {
    throw new StudyDeleteError(
      "db_failed",
      `No pudimos eliminar el registro del estudio: ${dbError.message}`
    );
  }
}

/**
 * Cuenta el total de estudios de un usuario.
 *
 * @param supabase Cliente Supabase autenticado (o doble de prueba).
 * @param userId   ID del usuario autenticado.
 * @returns Número total de estudios del usuario.
 */
export async function countStudiesCore(
  supabase: Supabase,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("studies")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw new Error("Error al contar los estudios del usuario.");
  }

  return count ?? 0;
}
