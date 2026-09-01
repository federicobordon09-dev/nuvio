import type { createClient } from "@/lib/supabase/server";
import { extractPdfText, PdfExtractionError } from "@/lib/extraction/pdf";
import type { ProcessingErrorCode } from "@/lib/studies-utils";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const STUDIES_TABLE = "studies";
const EXTRACTIONS_TABLE = "study_extractions";
const STORAGE_BUCKET = "medical-studies";

interface ProcessableStudy {
  id: string;
  user_id: string;
  file_path: string;
  mime_type: string;
  status: string;
  processing_error: string | null;
}

async function setStudyProcessingStatus(
  supabase: Supabase,
  study: Pick<ProcessableStudy, "id" | "user_id">,
  status: "processing" | "processed" | "error",
  processingError: string | null
): Promise<void> {
  await supabase
    .from(STUDIES_TABLE)
    .update({ status, processing_error: processingError })
    .eq("id", study.id)
    .eq("user_id", study.user_id);
}

export async function processStudy(
  supabase: Supabase,
  userId: string,
  studyId: string
): Promise<void> {
  const { data: study, error: fetchError } = await supabase
    .from(STUDIES_TABLE)
    .select("id, user_id, file_path, mime_type, status, processing_error")
    .eq("id", studyId)
    .eq("user_id", userId)
    .single();

  if (fetchError || !study) {
    throw new Error("Estudio no encontrado o sin acceso");
  }

  const target = study as unknown as ProcessableStudy;

  // Idempotencia: si ya está procesado y existe su extracción, no re-procesar.
  if (target.status === "processed") {
    const { data: existing } = await supabase
      .from(EXTRACTIONS_TABLE)
      .select("id")
      .eq("study_id", target.id)
      .maybeSingle();

    if (existing) {
      return;
    }
  }

  // El estado queda 'processing' hasta que el try/catch resuelva un estado
  // final ('processed' o 'error'): nunca se queda estancado por una excepción.
  await setStudyProcessingStatus(supabase, target, "processing", null);

  try {
    if (target.mime_type !== "application/pdf") {
      throw new PdfExtractionError(
        "ocr_required",
        "El documento no contiene texto extraíble; requiere OCR."
      );
    }

    const { data: blob, error: downloadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(target.file_path);

    if (downloadError || !blob) {
      throw new PdfExtractionError(
        "storage_missing",
        "No se encontró el archivo del estudio en el almacenamiento."
      );
    }

    const buffer = new Uint8Array(await blob.arrayBuffer());
    const { text, pageCount } = await extractPdfText(buffer);

    const { error: writeError } = await supabase
      .from(EXTRACTIONS_TABLE)
      .upsert(
        {
          study_id: target.id,
          user_id: target.user_id,
          extracted_text: text,
          page_count: pageCount,
          method: "pdf_text",
        },
        { onConflict: "study_id" }
      );

    if (writeError) {
      throw new PdfExtractionError(
        "write_failed",
        "El contenido se extrajo pero no se pudo guardar."
      );
    }

    await setStudyProcessingStatus(supabase, target, "processed", null);
  } catch (err) {
    const code: ProcessingErrorCode =
      err instanceof PdfExtractionError ? err.code : "extraction_failed";

    await setStudyProcessingStatus(supabase, target, "error", code);

    // Log interno seguro: solo IDs y código, nunca contenido del documento.
    console.error(
      `[nuvio:process-study] study=${target.id} code=${code}`
    );
  }
}