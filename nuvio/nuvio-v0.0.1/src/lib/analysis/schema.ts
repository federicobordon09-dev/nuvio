import { z } from "zod";

/**
 * Fase 8.1 — Contrato estructurado de salida para análisis médico.
 *
 * Evolución del schema Fase 4.2.1. Separación clara entre hallazgos
 * clínicos (key_findings) y mediciones/valores médicos (measurements).
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

// ── Medición médica ─────────────────────────────────────────────

/**
 * Estado de una medición respecto al rango de referencia.
 *
 * - within_range: el valor se encuentra dentro del rango normal.
 * - above_range: el valor está por encima del rango.
 * - below_range: el valor está por debajo del rango.
 * - abnormal: el valor es anormal (no simplemente alto/bajo).
 * - unknown: no se puede determinar el estado.
 * - no_reference: no hay rango de referencia disponible.
 */
export const MeasurementStatusSchema = z.enum([
  "within_range",
  "above_range",
  "below_range",
  "abnormal",
  "unknown",
  "no_reference",
]);

export type MeasurementStatus = z.infer<typeof MeasurementStatusSchema>;

/**
 * Una medición médica numérica/cuantitativa.
 *
 * Todos los campos excepto `name` son opcionales: si el documento
 * no proporciona la información, el campo debe omitirse en vez
 * de inventarse.
 */
export const MeasurementSchema = z.object({
  name: z.string().min(1),
  value: z.string().optional(),
  unit: z.string().nullable().optional(),
  reference_range: z.string().nullable().optional(),
  status: MeasurementStatusSchema.optional(),
});

export type Measurement = z.infer<typeof MeasurementSchema>;

// ── Hallazgo clínico ─────────────────────────────────────────────

/**
 * Estado/importancia de un hallazgo clínico.
 *
 * - normal: hallazgo sin relevancia clínica especial.
 * - high: hallazgo que requiere atención.
 * - low: hallazgo menor.
 * - abnormal: hallazgo anómalo que requiere evaluación.
 * - unknown: no se puede determinar la importancia.
 */
export const FindingStatusSchema = z.enum([
  "normal",
  "high",
  "low",
  "abnormal",
  "unknown",
]);

export type FindingStatus = z.infer<typeof FindingStatusSchema>;

/**
 * Hallazgo clínico principal encontrado en el documento.
 *
 * Representa una observación clínicamente relevante, NO un valor numérico.
 * Los valores numéricos/mediciones van en measurements.
 */
export const KeyFindingSchema = z.object({
  title: z.string().min(1),
  explanation: z.string().min(1),
  importance: FindingStatusSchema.optional(),
});

export type KeyFinding = z.infer<typeof KeyFindingSchema>;

// ── Análisis completo ────────────────────────────────────────────

/**
 * Schema principal del análisis médico estructurado.
 *
 * Compatibilidad hacia atrás:
 * - `measurements` defaulta a [] para análisis existentes sin esta propiedad.
 * - `study_type` permite null para análisis pre-análisis.
 * - `key_findings` usa el nuevo formato simplificado (sin value/unit).
 */
export const StudyAnalysisSchema = z.object({
  summary: z.string().min(1),
  document_type: z.string().min(1),
  study_type: StudyTypeSchema.nullable(),
  key_findings: z.array(KeyFindingSchema),
  measurements: z.array(MeasurementSchema).default([]),
  observations: z.array(z.string()),
  warnings: z.array(z.string()),
  recommendations: z.array(z.string()),
  limitations: z.array(z.string()),
});

export type StudyAnalysis = z.infer<typeof StudyAnalysisSchema>;

// ── Normalización de análisis legacy ──────────────────────────────

/**
 * Datos crudos de un análisis en formato legacy (Fase 4.x).
 *
 * En el formato anterior, key_findings contenía mediciones mezcladas
 * con hallazgos clínicos. Cada finding tenía value, unit, reference_range,
 * status y explanation.
 */
type LegacyKeyFinding = {
  title?: string;
  value?: string;
  unit?: string | null;
  reference_range?: string | null;
  status?: string;
  explanation?: string;
};

type LegacyStudyAnalysis = {
  summary?: string;
  document_type?: string;
  study_type?: string | null;
  key_findings?: LegacyKeyFinding[];
  observations?: string[];
  warnings?: string[];
  recommendations?: string[];
  limitations?: string[];
};

/**
 * Detecta si el dato es un análisis legacy (Fase 4.x) con el viejo
 * formato de key_findings que incluía value/status. Solo entonces
 * debe activarse la normalización.
 */
function isLegacyFormat(data: Record<string, unknown>): boolean {
  // Si ya tiene measurements, es formato nuevo
  if ("measurements" in data) return false;

  const kf = data.key_findings;
  if (!Array.isArray(kf) || kf.length === 0) return false;

  // Legacy si algún finding tiene `value` o `status` (campos exclusivos del viejo schema)
  for (const item of kf) {
    if (item && typeof item === "object" && ("value" in item || "status" in item)) {
      return true;
    }
  }

  return false;
}

/**
 * Convierte un análisis en formato legacy al nuevo formato.
 *
 * Transforma key_findings del legacy (que incluían value/unit/range/status)
 * en measurements separados + key_findings simplificados.
 *
 * Reglas:
 * - Si el finding tiene value → se crea una medición.
 * - Si el finding tiene title + explanation → se crea un hallazgo clínico.
 * - Se conservan todas las demás secciones sin cambios.
 */
export function normalizeLegacyAnalysis(raw: unknown): unknown | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  // Solo normalizar si es legacy real
  if (!isLegacyFormat(obj)) return null;

  const legacy = raw as LegacyStudyAnalysis;

  const measurements: Measurement[] = [];
  const keyFindings: KeyFinding[] = [];

  for (const finding of legacy.key_findings!) {
    if (!finding || typeof finding !== "object") continue;

    // Si tiene value → es una medición
    if (finding.value && typeof finding.value === "string") {
      const m: Measurement = {
        name: finding.title || "Valor sin nombre",
        value: finding.value,
      };
      if (finding.unit !== undefined) m.unit = finding.unit;
      if (finding.reference_range !== undefined) m.reference_range = finding.reference_range;
      const status = normalizeMeasurementStatus(finding.status);
      if (status) m.status = status;
      measurements.push(m);
    }

    // Si tiene title + explanation → es un hallazgo clínico
    if (finding.title && finding.explanation) {
      const kf: KeyFinding = {
        title: finding.title,
        explanation: finding.explanation,
      };
      const imp = normalizeFindingStatus(finding.status);
      if (imp) kf.importance = imp;
      keyFindings.push(kf);
    }
  }

  // Validar study_type
  let studyType: string | null = null;
  if (legacy.study_type && typeof legacy.study_type === "string") {
    const valid = STUDY_TYPE_VALUES.includes(legacy.study_type as typeof STUDY_TYPE_VALUES[number]);
    studyType = valid ? legacy.study_type : null;
  }

  return {
    summary: legacy.summary || "Análisis procesado.",
    document_type: legacy.document_type || "Documento médico",
    study_type: studyType,
    key_findings: keyFindings,
    measurements: measurements,
    observations: Array.isArray(legacy.observations) ? legacy.observations : [],
    warnings: Array.isArray(legacy.warnings) ? legacy.warnings : [],
    recommendations: Array.isArray(legacy.recommendations) ? legacy.recommendations : [],
    limitations: Array.isArray(legacy.limitations) ? legacy.limitations : [],
  };
}

/**
 * Convierte un status de medición legacy al nuevo enum.
 * Los valores antiguos (normal/high/low/abnormal/unknown) se mapean
 * a los nuevos (within_range/above_range/below_range/abnormal/unknown).
 */
function normalizeMeasurementStatus(status?: string): MeasurementStatus | undefined {
  switch (status) {
    case "normal": return "within_range";
    case "high": return "above_range";
    case "low": return "below_range";
    case "abnormal": return "abnormal";
    case "unknown": return "unknown";
    default: return undefined;
  }
}

/**
 * Convierte un status legacy de finding al nuevo FindingStatus.
 */
function normalizeFindingStatus(status?: string): FindingStatus | undefined {
  if (!status) return undefined;
  const valid = ["normal", "high", "low", "abnormal", "unknown"];
  return valid.includes(status as FindingStatus) ? (status as FindingStatus) : undefined;
}

// ── Helpers de validación ────────────────────────────────────────

/**
 * Valida datos crudos contra el contrato.
 * Retorna el objeto tipado si es válido; lanza ZodError si no lo es.
 *
 * Detecta formato legacy ANTES de validar para que los campos legacy
 * (value, status en key_findings) no se pierdan por strip de Zod.
 */
export function parseStudyAnalysis(data: unknown): StudyAnalysis {
  // Si es formato legacy, normalizar ANTES de validar
  const normalized = normalizeLegacyAnalysis(data);
  if (normalized !== null) {
    const normalizedResult = StudyAnalysisSchema.safeParse(normalized);
    if (normalizedResult.success) return normalizedResult.data;
  }

  // Validación directa (formato nuevo)
  return StudyAnalysisSchema.parse(data);
}

/**
 * Versión safe que no lanza: retorna { success, data, error }.
 * Detecta formato legacy ANTES de validar.
 */
export function safeParseStudyAnalysis(data: unknown) {
  // Si es formato legacy, normalizar ANTES de validar
  const normalized = normalizeLegacyAnalysis(data);
  if (normalized !== null) {
    return StudyAnalysisSchema.safeParse(normalized);
  }

  // Validación directa (formato nuevo)
  return StudyAnalysisSchema.safeParse(data);
}
