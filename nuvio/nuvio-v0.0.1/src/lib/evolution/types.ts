/**
 * Fase 10.4 — Tipos del motor de evolución longitudinal.
 *
 * Contrato determinista: transforma una serie cronológica de estudios
 * (mismo tipo, created_at ASC, todos aptos) en ParameterTrack[] con
 * puntos temporales y cambios entre pares consecutivos.
 *
 * No incluye key_findings: su matching longitudinal no es estable.
 * No fuzzy matching, conversión de unidades ni interpretación clínica.
 */

import type { MeasurementStatus, StudyAnalysis } from "../analysis/schema.ts";

/** Un estudio analizado listo para el motor de evolución. */
export type EvolutionStudy = StudyAnalysis & {
  /** ID del estudio (desde la BD). */
  id: string;
  /** Fecha de creación/ingesta — usada para orden cronológico. */
  created_at: string;
};

/** Punto temporal de un parámetro en un estudio específico. */
export type PointValue = {
  /** ID del estudio (para trazabilidad). */
  studyId: string;
  /** Fecha del estudio (created_at ASC). */
  date: string;
  /** Valor crudo tal como viene del análisis. */
  value: string;
  /** Valor parseado numéricamente (null si no es numérico). */
  numericValue: number | null;
  /** Unidad del parámetro en este punto (puede variar entre puntos). */
  unit: string | null | undefined;
  /** Rango de referencia en este punto (puede variar entre puntos). */
  referenceRange: string | null | undefined;
  /** Status del parámetro en este punto. */
  status: MeasurementStatus | undefined;
};

/** Cambio entre dos puntos consecutivos de un mismo parámetro. */
export type ValueChange =
  | { kind: "both_numeric"; absoluteDifference: number; percentageChange: number | null; direction: "increased" | "decreased" | "stable" }
  | { kind: "both_non_numeric" }
  | { kind: "one_numeric" }
  | { kind: "not_comparable"; reason: string };

/** Información sobre compatibilidad de unidades entre dos puntos. */
export type UnitCompatibility = {
  /** true si las unidades difieren (incluye una presente y otra ausente). */
  hasMismatch: boolean;
  /** Unidad del punto anterior. */
  previousUnit: string | null | undefined;
  /** Unidad del punto actual. */
  currentUnit: string | null | undefined;
};

/** Cambio de status entre dos puntos. */
export type StatusChange = {
  /** true si el status cambió entre puntos. */
  changed: boolean;
  /** Status del punto anterior. */
  previousStatus: MeasurementStatus | undefined;
  /** Status del punto actual. */
  currentStatus: MeasurementStatus | undefined;
};

/** Cambio de reference range entre dos puntos. */
export type ReferenceRangeChange = {
  /** true si el rango de referencia cambió entre puntos. */
  changed: boolean;
  /** Rango del punto anterior. */
  previousRange: string | null | undefined;
  /** Rango del punto actual. */
  currentRange: string | null | undefined;
};

/** Track completo de un parámetro a lo largo de la serie temporal. */
export type ParameterTrack = {
  /** Nombre del parámetro (identidad exacta, sin normalización). */
  name: string;
  /** Unidad del parámetro (puede variar entre puntos; aquí la del primer punto con unidad). */
  unit: string | null | undefined;
  /** Rango de referencia (puede variar; aquí el del primer punto con rango). */
  referenceRange: string | null | undefined;
  /** Puntos temporales ordenados ASC por date (created_at). */
  points: PointValue[];
  /** Cambios entre pares consecutivos: changes[i] = points[i] → points[i+1]. */
  changes: (ValueChange | null)[];
};

/** Motivos de incompatibilidad de serie (para validación del motor). */
export type SeriesIncompatibility =
  | { kind: "empty_series"; detail: string }
  | { kind: "not_enough_studies"; detail: string }
  | { kind: "too_many_studies"; detail: string }
  | { kind: "mixed_study_type"; detail: string }
  | { kind: "missing_analysis"; detail: string }
  | { kind: "not_chronological"; detail: string };

/** Resultado completo del motor de evolución. */
export type EvolutionResult =
  | { comparable: false; incompatibility: SeriesIncompatibility }
  | {
      comparable: true;
      /** study_type homogéneo de la serie. */
      studyType: string;
      /** Estudios de entrada (metadata + analysis) en orden cronológico ASC. */
      studies: EvolutionStudy[];
      /** Tracks de parámetros longitudinales. */
      parameters: ParameterTrack[];
      /** Resumen general de la serie. */
      overall: EvolutionOverall;
    };

/** Resumen técnico general de la evolución. */
export type EvolutionOverall = {
  /** Número de parámetros únicos en la serie. */
  uniqueParameters: number;
  /** Número de parámetros presentes en todos los estudios. */
  persistentParameters: number;
  /** Número de parámetros que aparecen/disaparecen. */
  transientParameters: number;
  /** Total de cambios numéricos comparables (both_numeric). */
  numericChanges: number;
  /** De ellos, aumentos. */
  increased: number;
  /** De ellos, disminuciones. */
  decreased: number;
  /** De ellos, estables. */
  stable: number;
  /** Pares no comparables (unidades, no numéricos, etc.). */
  notComparableChanges: number;
};

/** Entrada validada del motor: estudios ya filtrados, ordenados, same-type. */
export type EvolutionInput = {
  studies: EvolutionStudy[];
};