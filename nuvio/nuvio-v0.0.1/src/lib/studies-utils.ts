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

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}