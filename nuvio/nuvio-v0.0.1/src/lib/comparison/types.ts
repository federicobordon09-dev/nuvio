import type { Measurement, MeasurementStatus, KeyFinding, StudyAnalysis } from "../analysis/schema.ts";

/** Estados de análisis válidos del pipeline. */
export type AnalysisStatus = "pending" | "processing" | "completed" | "failed";

/** Estudio listo para comparación: análisis parseado + metadatos del pipeline. */
export type StudyForComparison = {
  analysis: StudyAnalysis;
  analysisStatus: AnalysisStatus;
};

/** Resultado de incompatibilidad entre dos estudios. */
export type ComparisonIncompatibility =
  | { kind: "not_completed"; detail: string }
  | { kind: "missing_study_type"; detail: string }
  | { kind: "different_study_type"; detail: string }
  | { kind: "empty_analysis"; detail: string };

/** Diferencia en el valor numérico de una medición. */
export type ValueDiff =
  | { kind: "both_numeric"; absoluteDifference: number; percentageChange: number | null; direction: "increased" | "decreased" | "stable" }
  | { kind: "both_non_numeric" }
  | { kind: "one_numeric" }
  | { kind: "not_comparable"; reason: string };

/** Diferencia de unidad entre dos mediciones. */
export type UnitMismatch = {
  hasMismatch: boolean;
  previousUnit: string | null | undefined;
  currentUnit: string | null | undefined;
};

/** Diferencia de estado de medición. */
export type StatusDiff = {
  changed: boolean;
  previousStatus: MeasurementStatus | undefined;
  currentStatus: MeasurementStatus | undefined;
};

/** Diferencia de rango de referencia. */
export type ReferenceRangeDiff = {
  changed: boolean;
  previousRange: string | null | undefined;
  currentRange: string | null | undefined;
};

/** Diferencia completa entre dos mediciones con el mismo nombre. */
export type MeasurementComparable = {
  name: string;
  status: "comparable";
  previousValue: string;
  currentValue: string;
  previousNumeric: number | null;
  currentNumeric: number | null;
  valueDiff: ValueDiff;
  unitMismatch: UnitMismatch;
  statusDiff: StatusDiff;
  referenceRangeDiff: ReferenceRangeDiff;
};

/** Parámetro presente solo en el estudio actual (B). */
export type MeasurementNew = {
  name: string;
  status: "new";
  measurement: Measurement;
};

/** Parámetro presente solo en el estudio anterior (A). */
export type MeasurementMissing = {
  name: string;
  status: "missing";
  measurement: Measurement;
};

/** Resultado de la comparación de mediciones. */
export type MeasurementDiff = MeasurementComparable | MeasurementNew | MeasurementMissing;

/** Diferencia entre dos hallazgos con el mismo título. */
export type KeyFindingComparable = {
  title: string;
  status: "comparable";
  previousImportance: KeyFinding["importance"];
  currentImportance: KeyFinding["importance"];
  importanceChanged: boolean;
};

/** Hallazgo presente solo en el estudio actual (B). */
export type KeyFindingNew = {
  title: string;
  status: "new";
  finding: KeyFinding;
};

/** Hallazgo presente solo en el estudio anterior (A). */
export type KeyFindingMissing = {
  title: string;
  status: "missing";
  finding: KeyFinding;
};

/** Resultado de la comparación de hallazgos. */
export type KeyFindingDiff = KeyFindingComparable | KeyFindingNew | KeyFindingMissing;

/** Resumen técnico del cambio numérico. */
export type NumericSummary = {
  comparableCount: number;
  increasedCount: number;
  decreasedCount: number;
  stableCount: number;
  notComparableCount: number;
};

/** Resultado general de la comparación. */
export type OverallDiff = {
  numericSummary: NumericSummary;
  newParametersCount: number;
  missingParametersCount: number;
  newFindingsCount: number;
  missingFindingsCount: number;
};

/** Resultado completo de la comparación de dos estudios. */
export type ComparisonResult =
  | { comparable: false; incompatibility: ComparisonIncompatibility }
  | {
      comparable: true;
      measurementDiffs: MeasurementDiff[];
      keyFindingDiffs: KeyFindingDiff[];
      overall: OverallDiff;
    };
