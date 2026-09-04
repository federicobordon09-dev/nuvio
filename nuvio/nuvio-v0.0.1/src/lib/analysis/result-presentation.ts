import type { StudyType } from "@/lib/studies-utils";
import type { StudyAnalysis } from "./schema";

/**
 * Fase 8.3 — Presentación de resultados según tipo de estudio.
 *
 * Define CÓMO se presentan los resultados (orden de secciones, sección
 * primaria y labels contextuales) sin modificar el contenido médico.
 *
 * Regla principal: el `study_type` determina la presentación, NO el
 * diagnóstico. No se agrega lógica médica, no se inventan valores ni
 * hallazgos: solo se reordena/prioriza lo que ya existe en el análisis
 * persistido.
 */

/** Secciones reordenables dentro de `AnalysisResult`. */
export type ResultSection =
  | "findings"
  | "measurements"
  | "observations"
  | "warnings"
  | "recommendations"
  | "limitations";

/** Secciones que pueden tener jerarquía visual superior. */
export type PrimaryResultSection = "findings" | "measurements";

export type StudyResultPresentation = {
  /** Orden de las secciones dentro de AnalysisResult (sin header ni disclaimer). */
  sectionOrder: ResultSection[];
  /** Sección con jerarquía visual superior (opcional). */
  primarySection?: PrimaryResultSection;
  /** Labels contextuales por sección (opcional). */
  labels?: Partial<Record<ResultSection, string>>;
};

/** Orden genérico y seguro (fallback para "other", null y tipos desconocidos). */
const FALLBACK_ORDER: ResultSection[] = [
  "findings",
  "measurements",
  "observations",
  "warnings",
  "recommendations",
  "limitations",
];

const PRESENTATIONS: Record<StudyType, StudyResultPresentation> = {
  // Laboratorio / análisis de sangre: las mediciones son protagonistas.
  blood_test: {
    sectionOrder: [
      "measurements",
      "findings",
      "observations",
      "warnings",
      "recommendations",
      "limitations",
    ],
    primarySection: "measurements",
  },

  // Resonancia magnética: los hallazgos son protagonistas.
  MRI: {
    sectionOrder: [
      "findings",
      "observations",
      "measurements",
      "warnings",
      "recommendations",
      "limitations",
    ],
    primarySection: "findings",
  },

  // Tomografía: misma filosofía que MRI.
  CT: {
    sectionOrder: [
      "findings",
      "observations",
      "measurements",
      "warnings",
      "recommendations",
      "limitations",
    ],
    primarySection: "findings",
  },

  // Electrocardiograma: mediciones/parámetros y hallazgos equilibrados.
  ECG: {
    sectionOrder: [
      "measurements",
      "findings",
      "observations",
      "warnings",
      "recommendations",
      "limitations",
    ],
    labels: { measurements: "Parámetros" },
  },

  // Epicrisis / alta médica: resumen + hallazgos/observaciones protagonistas.
  epicrisis: {
    sectionOrder: [
      "findings",
      "observations",
      "recommendations",
      "warnings",
      "limitations",
      "measurements",
    ],
    primarySection: "findings",
  },

  // Informe médico: resumen + hallazgos.
  medical_report: {
    sectionOrder: [
      "findings",
      "observations",
      "recommendations",
      "warnings",
      "measurements",
      "limitations",
    ],
    primarySection: "findings",
  },

  // Otro: presentación genérica y segura.
  other: {
    sectionOrder: [...FALLBACK_ORDER],
  },
};

/**
 * Devuelve la configuración de presentación para un tipo de estudio.
 * Si el tipo es null, undefined o desconocido, devuelve el fallback genérico.
 */
export function getStudyResultPresentation(
  studyType: StudyType | null | undefined
): StudyResultPresentation {
  if (studyType && studyType in PRESENTATIONS) {
    return PRESENTATIONS[studyType];
  }
  return { sectionOrder: [...FALLBACK_ORDER] };
}

/**
 * Indica si una sección tiene contenido en el análisis.
 * Las secciones vacías se ocultan (regla de Fase 8.2), independientemente
 * del tipo de estudio.
 */
export function hasResultSectionContent(
  analysis: StudyAnalysis,
  section: ResultSection
): boolean {
  switch (section) {
    case "findings":
      return analysis.key_findings.length > 0;
    case "measurements":
      return analysis.measurements.length > 0;
    case "observations":
      return analysis.observations.length > 0;
    case "warnings":
      return analysis.warnings.length > 0;
    case "recommendations":
      return analysis.recommendations.length > 0;
    case "limitations":
      return analysis.limitations.length > 0;
  }
}

/**
 * Devuelve las secciones que se deben renderizar, en el orden correcto
 * para el tipo de estudio, omitiendo las secciones sin contenido.
 */
export function getVisibleResultSections(analysis: StudyAnalysis): ResultSection[] {
  const presentation = getStudyResultPresentation(analysis.study_type);
  return presentation.sectionOrder.filter((section) =>
    hasResultSectionContent(analysis, section)
  );
}
