"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES, ALLOWED_STUDY_TYPES, type StudyType } from "@/lib/studies-utils";

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
    study_type: StudyType;
    status: string;
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

export async function uploadStudy(formData: FormData) {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);

  const file = formData.get("file") as File | null;
  const studyType = formData.get("studyType") as string;

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

  if (!(ALLOWED_STUDY_TYPES as readonly string[]).includes(studyType)) {
    throw new Error("Tipo de estudio no válido.");
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
    study_type: studyType,
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
  redirect("/dashboard/estudios");
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

  const { data: study, error: fetchError } = await supabase
    .from("studies")
    .select("file_path, user_id")
    .eq("id", studyId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !study) {
    throw new Error("Estudio no encontrado o sin acceso");
  }

  const { error: storageError } = await supabase.storage
    .from("medical-studies")
    .remove([study.file_path]);

  // Se elimina el registro igualmente; si falla el storage, el archivo
  // queda huérfano pero el usuario recibe feedback de la operación principal.
  if (storageError) {
    // No propagar: se continúa con la eliminación del registro.
  }

  const { error: dbError } = await supabase
    .from("studies")
    .delete()
    .eq("id", studyId)
    .eq("user_id", user.id);

  if (dbError) {
    throw new Error(`Error al eliminar el estudio: ${dbError.message}`);
  }

  revalidatePath("/dashboard/estudios");
  redirect("/dashboard/estudios");
}

export async function deleteStudyAction(formData: FormData) {
  const studyId = formData.get("studyId");
  if (typeof studyId !== "string") {
    throw new Error("ID de estudio inválido.");
  }
  await deleteStudy(studyId);
}