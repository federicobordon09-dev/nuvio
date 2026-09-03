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

/**
 * Versión null-safe de getStudyTypeLabel.
 * Si el tipo es null o no está en el mapping, devuelve "Pendiente de análisis".
 * Se usa en la UI cuando el estudio aún no fue analizado por IA.
 */
export function getStudyTypeLabelNullable(
  type: StudyType | null | undefined
): string {
  if (!type) return "Pendiente de análisis";
  return STUDY_TYPE_LABELS[type] ?? "Pendiente de análisis";
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

// ── Analysis statuses ──────────────────────────────────────────

export const ANALYSIS_STATUSES = [
  { value: "pending", label: "Pendiente" },
  { value: "processing", label: "En progreso" },
  { value: "completed", label: "Completado" },
  { value: "failed", label: "Fallido" },
] as const;

export function getAnalysisStatusLabel(status: string): string {
  const found = ANALYSIS_STATUSES.find((s) => s.value === status);
  return found?.label ?? "Desconocido";
}

// ── Study stages (combined document + analysis status) ─────────

export type StudyStage =
  | "pending_processing"
  | "processing"
  | "error_processing"
  | "pending_analysis"
  | "analyzing"
  | "ready"
  | "error_analysis"
  | "unknown";

export const STUDY_STAGE_LABELS: Record<StudyStage, string> = {
  pending_processing: "Pendiente de procesamiento",
  processing: "Procesando",
  error_processing: "Error de procesamiento",
  pending_analysis: "Análisis pendiente",
  analyzing: "Analizando con IA",
  ready: "Listo",
  error_analysis: "Error de análisis",
  unknown: "Estado desconocido",
};

export const STUDY_STAGE_STYLES: Record<
  StudyStage,
  { bg: string; text: string; dot: string }
> = {
  pending_processing: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
  processing: {
    bg: "bg-ocean-tint",
    text: "text-ocean",
    dot: "bg-ocean",
  },
  error_processing: {
    bg: "bg-danger-tint",
    text: "text-danger",
    dot: "bg-danger",
  },
  pending_analysis: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground/50",
  },
  analyzing: {
    bg: "bg-ocean-tint",
    text: "text-ocean",
    dot: "bg-ocean",
  },
  ready: {
    bg: "bg-success-tint",
    text: "text-success-strong",
    dot: "bg-success",
  },
  error_analysis: {
    bg: "bg-danger-tint",
    text: "text-danger",
    dot: "bg-danger",
  },
  unknown: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

/**
 * Determina el stage combinado de un estudio (documento + análisis).
 */
export function getStudyStage(
  status: string,
  analysisStatus?: string
): StudyStage {
  if (status === "uploaded") return "pending_processing";
  if (status === "processing") return "processing";
  if (status === "error") return "error_processing";
  if (status === "processed") {
    if (analysisStatus === "processing") return "analyzing";
    if (analysisStatus === "completed") return "ready";
    if (analysisStatus === "failed") return "error_analysis";
    return "pending_analysis";
  }
  return "unknown";
}

/**
 * Devuelve la etiqueta del stage combinado (p. ej. "Listo", "Analizando con IA").
 */
export function getStudyStageLabel(
  status: string,
  analysisStatus?: string
): string {
  return STUDY_STAGE_LABELS[getStudyStage(status, analysisStatus)];
}

/**
 * Devuelve las clases de Tailwind para el badge del stage combinado.
 */
export function getStudyStageStyles(
  status: string,
  analysisStatus?: string
): string {
  const stage = getStudyStage(status, analysisStatus);
  const styles = STUDY_STAGE_STYLES[stage];
  return `${styles.bg} ${styles.text}`;
}

/**
 * Devuelve la clase del dot colorido para el badge del stage.
 */
export function getStudyStageDotStyle(
  status: string,
  analysisStatus?: string
): string {
  const stage = getStudyStage(status, analysisStatus);
  return STUDY_STAGE_STYLES[stage].dot;
}

// ── Dashboard stats ────────────────────────────────────────────

export type StudyStats = {
  total: number;
  ready: number; // procesado + análisis completado
  in_progress: number; // procesando documento o analizando con IA
  pending: number; // pendiente de procesamiento o de análisis
  errors: number; // error de procesamiento o de análisis
};

/**
 * Agrupa estudios por stage combinado (documento + análisis) para
 * el resumen del dashboard. Lógica pura y testeable.
 */
export function computeStudyStats(
  rows: Array<{ status: string; analysis_status?: string | null }>
): StudyStats {
  const stats: StudyStats = {
    total: rows.length,
    ready: 0,
    in_progress: 0,
    pending: 0,
    errors: 0,
  };

  for (const row of rows) {
    const stage = getStudyStage(row.status, row.analysis_status ?? undefined);
    switch (stage) {
      case "ready":
        stats.ready++;
        break;
      case "processing":
      case "analyzing":
        stats.in_progress++;
        break;
      case "pending_processing":
      case "pending_analysis":
        stats.pending++;
        break;
      case "error_processing":
      case "error_analysis":
        stats.errors++;
        break;
      default:
        break;
    }
  }

  return stats;
}

// ── Analysis errors ─────────────────────────────────────────────

export const ANALYSIS_ERRORS = [
  { code: "unauthenticated", label: "Sesión expirada" },
  { code: "study_not_found", label: "Estudio no encontrado" },
  { code: "study_not_ready", label: "Estudio sin procesar" },
  { code: "extraction_error", label: "Error al leer el contenido" },
  { code: "extraction_missing", label: "Contenido no disponible" },
  { code: "extraction_empty", label: "Contenido vacío" },
  { code: "gemini_timeout", label: "La IA tardó demasiado" },
  { code: "gemini_network", label: "Error de conexión con la IA" },
  { code: "gemini_api_error", label: "Error del servicio de IA" },
  { code: "gemini_invalid_response", label: "Respuesta no válida de la IA" },
  { code: "gemini_failed", label: "Error desconocido de la IA" },
  { code: "persist_failed", label: "No se pudo guardar el análisis" },
  { code: "analysis_in_progress", label: "Análisis en curso" },
] as const;