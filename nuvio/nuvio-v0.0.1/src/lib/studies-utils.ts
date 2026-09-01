export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_STUDY_TYPES = [
  "blood_test",
  "MRI",
  "CT",
  "ECG",
  "epicrisis",
  "medical_report",
  "other",
] as const;

export type StudyType = typeof ALLOWED_STUDY_TYPES[number];

export const STUDY_TYPE_LABELS: Record<StudyType, string> = {
  blood_test: "Análisis de sangre",
  MRI: "Resonancia magnética",
  CT: "Tomografía computarizada",
  ECG: "Electrocardiograma",
  epicrisis: "Epicrisis",
  medical_report: "Informe médico",
  other: "Otro",
};

export function getStudyTypeLabel(type: StudyType): string {
  return STUDY_TYPE_LABELS[type];
}

export const STUDY_STATUSES = [
  "uploaded",
  "processing",
  "processed",
  "error",
] as const;

export type StudyStatus = (typeof STUDY_STATUSES)[number];

export const STUDY_STATUS_LABELS: Record<StudyStatus, string> = {
  uploaded: "Pendiente de procesamiento",
  processing: "Procesando",
  processed: "Procesado",
  error: "Error de procesamiento",
};

export function getStudyStatusLabel(status: string): string {
  return STUDY_STATUS_LABELS[status as StudyStatus] ?? "Estado desconocido";
}

export const PROCESSING_ERROR_CODES = [
  "ocr_required",
  "invalid_pdf",
  "extraction_failed",
  "storage_missing",
  "write_failed",
  "generic",
] as const;

export type ProcessingErrorCode = (typeof PROCESSING_ERROR_CODES)[number];

export const PROCESSING_ERROR_LABELS: Record<ProcessingErrorCode, string> = {
  ocr_required:
    "El documento no contiene texto extraíble (PDF escaneado o imagen). El procesamiento con OCR estará disponible próximamente.",
  invalid_pdf: "El archivo no es un PDF válido o está corrupto.",
  extraction_failed:
    "No se pudo extraer el contenido del documento. Probá con otro archivo.",
  storage_missing:
    "No se encontró el archivo del estudio. Reintentá el procesamiento.",
  write_failed:
    "El documento se procesó, pero no se pudo guardar el contenido extraído.",
  generic: "Ocurrió un error inesperado al procesar el documento.",
};

export function getProcessingErrorLabel(
  code: string | null | undefined
): string {
  if (!code) return PROCESSING_ERROR_LABELS.generic;
  return (
    PROCESSING_ERROR_LABELS[code as ProcessingErrorCode] ??
    PROCESSING_ERROR_LABELS.generic
  );
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}