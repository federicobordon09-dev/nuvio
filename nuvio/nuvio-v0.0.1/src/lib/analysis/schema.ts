import { z } from "zod";

/**
 * Fase 4.2.1 — Contrato estructurado de salida para análisis médico.
 *
 * Este schema define la forma exacta de la respuesta que Gemini producirá
 * al analizar un documento médico. NO implementa ninguna llamada a IA;
 * solo define el contrato validable.
 *
 * Reglas del contrato:
 * - La IA trabaja únicamente con el texto extraído proporcionado.
 * - No inventa valores, unidades, rangos, diagnósticos ni medicamentos.
 * - Si un dato es ambiguo, refleja esa ambigüedad en `limitations`.
 * - Nuvio explica información médica; no reemplaza a un profesional.
 */

/** Valores internos de clasificación de tipo de estudio. */
const STUDY_TYPE_VALUES = [
  "blood_test",
  "MRI",
  "CT",
  "ECG",
  "epicrisis",
  "medical_report",
  "other",
] as const;

export const StudyTypeSchema = z.enum(STUDY_TYPE_VALUES);

export const FindingStatusSchema = z.enum([
  "normal",
  "high",
  "low",
  "abnormal",
  "unknown",
]);

export type FindingStatus = z.infer<typeof FindingStatusSchema>;

export const KeyFindingSchema = z.object({
  title: z.string().min(1),
  value: z.string().min(1),
  unit: z.string().nullable(),
  reference_range: z.string().nullable(),
  status: FindingStatusSchema,
  explanation: z.string().min(1),
});

export type KeyFinding = z.infer<typeof KeyFindingSchema>;

export const StudyAnalysisSchema = z.object({
  summary: z.string().min(1),
  document_type: z.string().min(1),
  study_type: StudyTypeSchema,
  key_findings: z.array(KeyFindingSchema),
  observations: z.array(z.string()),
  warnings: z.array(z.string()),
  recommendations: z.array(z.string()),
  limitations: z.array(z.string()),
});

export type StudyAnalysis = z.infer<typeof StudyAnalysisSchema>;

/**
 * Valida datos crudos contra el contrato.
 * Retorna el objeto tipado si es válido; lanza ZodError si no lo es.
 */
export function parseStudyAnalysis(data: unknown): StudyAnalysis {
  return StudyAnalysisSchema.parse(data);
}

/**
 * Versión safe que no lanza: retorna { success, data, error }.
 */
export function safeParseStudyAnalysis(data: unknown) {
  return StudyAnalysisSchema.safeParse(data);
}
