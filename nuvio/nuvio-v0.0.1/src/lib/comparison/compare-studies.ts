import type { Measurement, KeyFinding, MeasurementStatus } from "../analysis/schema.ts";
import type {
  StudyForComparison,
  ComparisonIncompatibility,
  ComparisonResult,
  MeasurementDiff,
  MeasurementComparable,
  MeasurementNew,
  MeasurementMissing,
  KeyFindingDiff,
  KeyFindingComparable,
  KeyFindingNew,
  KeyFindingMissing,
  ValueDiff,
  UnitMismatch,
  StatusDiff,
  ReferenceRangeDiff,
  NumericSummary,
  OverallDiff,
  AnalysisStatus,
} from "./types.ts";

/**
 * Intenta parsear un valor string como número.
 *
 * Solo acepta cadenas que representen un número entero o decimal puro.
 * No acepta valores con unidades, texto, espacios internos ni ningún otro
 * formato no numérico.
 *
 * Retorna `null` si el valor no es inequívocamente numérico.
 */
function parseNumericValue(value: string): number | null {
  if (!value || typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null;
  return Number(trimmed);
}

/**
 * Determina la dirección del cambio entre dos valores numéricos.
 *
 * `stable` solo cuando los valores son exactamente iguales.
 */
function getDirection(previous: number, current: number): "increased" | "decreased" | "stable" {
  if (current === previous) return "stable";
  return current > previous ? "increased" : "decreased";
}

/**
 * Calcula la diferencia de valor entre dos mediciones numéricas.
 */
function computeValueDiff(
  previousValue: string,
  currentValue: string,
  unitsMismatch = false
): ValueDiff {
  const previousNumeric = parseNumericValue(previousValue);
  const currentNumeric = parseNumericValue(currentValue);

  if (previousNumeric !== null && currentNumeric !== null) {
    // Sin conversión de unidades (fuera de alcance en esta fase): si ambos
    // valores son numéricos pero las unidades no coinciden, NO son comparables.
    if (unitsMismatch) {
      return {
        kind: "not_comparable",
        reason: "Las unidades no coinciden y la conversión de unidades no está implementada",
      };
    }

    const absoluteDifference = Math.abs(currentNumeric - previousNumeric);
    const percentageChange =
      previousNumeric !== 0
        ? ((currentNumeric - previousNumeric) / previousNumeric) * 100
        : null;
    const direction = getDirection(previousNumeric, currentNumeric);
    return {
      kind: "both_numeric",
      absoluteDifference,
      percentageChange,
      direction,
    };
  }

  if (previousNumeric === null && currentNumeric === null) {
    return { kind: "both_non_numeric" };
  }

  return { kind: "one_numeric" };
}

/**
 * Verifica si las unidades difieren.
 *
 * Unidades que difieren incluyen: strings diferentes, una definida y otra no,
 * null vs string, undefined vs string.
 */
function computeUnitMismatch(
  previousUnit: string | null | undefined,
  currentUnit: string | null | undefined
): UnitMismatch {
  // null y undefined significan "sin unidad" en el dominio: se normalizan
  // para que solo cuente como mismatch cuando las unidades difieren de verdad.
  const prev = previousUnit ?? undefined;
  const curr = currentUnit ?? undefined;
  const hasMismatch = prev !== curr;
  return {
    hasMismatch,
    previousUnit: prev,
    currentUnit: curr,
  };
}

/**
 * Verifica si el estado de la medición cambió.
 */
function computeStatusDiff(
  previousStatus: MeasurementStatus | undefined,
  currentStatus: MeasurementStatus | undefined
): StatusDiff {
  const changed = previousStatus !== currentStatus;
  return {
    changed,
    previousStatus,
    currentStatus,
  };
}

/**
 * Verifica si el rango de referencia cambió.
 */
function computeReferenceRangeDiff(
  previousRange: string | null | undefined,
  currentRange: string | null | undefined
): ReferenceRangeDiff {
  // Igual criterio que unidades: null y undefined ambos significan "sin rango".
  const prev = previousRange ?? undefined;
  const curr = currentRange ?? undefined;
  const changed = prev !== curr;
  return {
    changed,
    previousRange: prev,
    currentRange: curr,
  };
}

/**
 * Determina si dos estudios son comparables.
 *
 * Retorna `null` si son comparables, o un `ComparisonIncompatibility` si no lo son.
 *
 * Reglas:
 * - Ambos deben tener `analysisStatus === "completed"`
 * - Ambos deben tener `study_type` no nulo
 * - Ambos deben tener el mismo `study_type`
 * - Ambos deben tener resumen no vacío
 */
export function isComparable(
  studyA: StudyForComparison,
  studyB: StudyForComparison
): ComparisonIncompatibility | null {
  const statusA: AnalysisStatus = studyA.analysisStatus;
  const statusB: AnalysisStatus = studyB.analysisStatus;

  if (statusA !== "completed") {
    return {
      kind: "not_completed",
      detail: `El estudio A tiene analysis_status "${statusA}", se requiere "completed"`,
    };
  }

  if (statusB !== "completed") {
    return {
      kind: "not_completed",
      detail: `El estudio B tiene analysis_status "${statusB}", se requiere "completed"`,
    };
  }

  const studyTypeA = studyA.analysis.study_type;
  const studyTypeB = studyB.analysis.study_type;

  if (studyTypeA === null) {
    return {
      kind: "missing_study_type",
      detail: "El estudio A no tiene study_type definido",
    };
  }

  if (studyTypeB === null) {
    return {
      kind: "missing_study_type",
      detail: "El estudio B no tiene study_type definido",
    };
  }

  if (studyTypeA !== studyTypeB) {
    return {
      kind: "different_study_type",
      detail: `Tipos diferentes: "${studyTypeA}" vs "${studyTypeB}"`,
    };
  }

  const summaryA = studyA.analysis.summary?.trim();
  const summaryB = studyB.analysis.summary?.trim();

  if (!summaryA || !summaryB) {
    return {
      kind: "empty_analysis",
      detail: "Uno o ambos estudios tienen resumen vacío o ausente",
    };
  }

  return null;
}

/**
 * Compara los arrays de mediciones de dos estudios.
 *
 * Coincidencia por nombre exacto. No se usa fuzzy matching.
 *
 * Resultado:
 * - mismo nombre → MeasurementComparable
 * - solo en B → MeasurementNew
 * - solo en A → MeasurementMissing
 */
export function compareMeasurements(
  measurementsA: Measurement[],
  measurementsB: Measurement[]
): MeasurementDiff[] {
  const mapA = new Map<string, Measurement>();
  const mapB = new Map<string, Measurement>();

  for (const m of measurementsA) {
    mapA.set(m.name, m);
  }
  for (const m of measurementsB) {
    mapB.set(m.name, m);
  }

  const diffs: MeasurementDiff[] = [];
  const processedNames = new Set<string>();

  // Procesar todos los nombres de B (incluye los compartidos)
  for (const [name, measurementB] of mapB) {
    processedNames.add(name);
    const measurementA = mapA.get(name);

    if (measurementA) {
      // Ambos tienen este nombre → comparable
      const previousValue = measurementA.value ?? "";
      const currentValue = measurementB.value ?? "";
      const unitMismatch = computeUnitMismatch(
        measurementA.unit,
        measurementB.unit
      );
      const valueDiff = computeValueDiff(
        previousValue,
        currentValue,
        unitMismatch.hasMismatch
      );
      const statusDiff = computeStatusDiff(
        measurementA.status,
        measurementB.status
      );
      const referenceRangeDiff = computeReferenceRangeDiff(
        measurementA.reference_range,
        measurementB.reference_range
      );

      const comparable: MeasurementComparable = {
        name,
        status: "comparable",
        previousValue,
        currentValue,
        previousNumeric: parseNumericValue(previousValue),
        currentNumeric: parseNumericValue(currentValue),
        valueDiff,
        unitMismatch,
        statusDiff,
        referenceRangeDiff,
      };
      diffs.push(comparable);
    } else {
      // Solo en B → nuevo
      const newEntry: MeasurementNew = {
        name,
        status: "new",
        measurement: measurementB,
      };
      diffs.push(newEntry);
    }
  }

  // Parámetros solo en A (ausentes en B)
  for (const [name, measurementA] of mapA) {
    if (!processedNames.has(name)) {
      const missingEntry: MeasurementMissing = {
        name,
        status: "missing",
        measurement: measurementA,
      };
      diffs.push(missingEntry);
    }
  }

  return diffs;
}

/**
 * Compara los arrays de key_findings de dos estudios.
 *
 * Coincidencia por title exacto. No se usa fuzzy matching.
 *
 * Resultado:
 * - mismo title → KeyFindingComparable
 * - solo en B → KeyFindingNew
 * - solo en A → KeyFindingMissing
 */
export function compareKeyFindings(
  findingsA: KeyFinding[],
  findingsB: KeyFinding[]
): KeyFindingDiff[] {
  const mapA = new Map<string, KeyFinding>();
  const mapB = new Map<string, KeyFinding>();

  for (const f of findingsA) {
    mapA.set(f.title, f);
  }
  for (const f of findingsB) {
    mapB.set(f.title, f);
  }

  const diffs: KeyFindingDiff[] = [];
  const processedTitles = new Set<string>();

  for (const [title, findingB] of mapB) {
    processedTitles.add(title);
    const findingA = mapA.get(title);

    if (findingA) {
      const previousImportance = findingA.importance;
      const currentImportance = findingB.importance;
      const importanceChanged = previousImportance !== currentImportance;

      const comparable: KeyFindingComparable = {
        title,
        status: "comparable",
        previousImportance,
        currentImportance,
        importanceChanged,
      };
      diffs.push(comparable);
    } else {
      const newEntry: KeyFindingNew = {
        title,
        status: "new",
        finding: findingB,
      };
      diffs.push(newEntry);
    }
  }

  for (const [title, findingA] of mapA) {
    if (!processedTitles.has(title)) {
      const missingEntry: KeyFindingMissing = {
        title,
        status: "missing",
        finding: findingA,
      };
      diffs.push(missingEntry);
    }
  }

  return diffs;
}

/**
 * Calcula el resumen numérico general.
 */
function computeNumericSummary(measurementDiffs: MeasurementDiff[]): NumericSummary {
  let comparableCount = 0;
  let increasedCount = 0;
  let decreasedCount = 0;
  let stableCount = 0;
  let notComparableCount = 0;

  for (const diff of measurementDiffs) {
    if (diff.status === "comparable") {
      comparableCount++;
      const vd = diff.valueDiff;
      if (vd.kind === "both_numeric") {
        switch (vd.direction) {
          case "increased":
            increasedCount++;
            break;
          case "decreased":
            decreasedCount++;
            break;
          case "stable":
            stableCount++;
            break;
        }
      } else {
        notComparableCount++;
      }
    }
  }

  return {
    comparableCount,
    increasedCount,
    decreasedCount,
    stableCount,
    notComparableCount,
  };
}

/**
 * Calcula el OverallDiff a partir de todas las diferencias.
 */
function computeOverall(
  measurementDiffs: MeasurementDiff[],
  keyFindingDiffs: KeyFindingDiff[]
): OverallDiff {
  const numericSummary = computeNumericSummary(measurementDiffs);

  let newParametersCount = 0;
  let missingParametersCount = 0;
  let newFindingsCount = 0;
  let missingFindingsCount = 0;

  for (const diff of measurementDiffs) {
    if (diff.status === "new") newParametersCount++;
    if (diff.status === "missing") missingParametersCount++;
  }

  for (const diff of keyFindingDiffs) {
    if (diff.status === "new") newFindingsCount++;
    if (diff.status === "missing") missingFindingsCount++;
  }

  return {
    numericSummary,
    newParametersCount,
    missingParametersCount,
    newFindingsCount,
    missingFindingsCount,
  };
}

/**
 * Punto de entrada principal del motor de comparación.
 *
 * Recibe dos estudios ya autorizados y parseados, con sus metadatos
 * de análisis, y devuelve un ComparisonResult tipado.
 *
 * No tiene side effects. No accede a ninguna base de datos ni servicio externo.
 */
export function compareStudies(
  studyA: StudyForComparison,
  studyB: StudyForComparison
): ComparisonResult {
  const incompatibility = isComparable(studyA, studyB);
  if (incompatibility !== null) {
    return { comparable: false, incompatibility };
  }

  const measurementDiffs = compareMeasurements(
    studyA.analysis.measurements,
    studyB.analysis.measurements
  );

  const keyFindingDiffs = compareKeyFindings(
    studyA.analysis.key_findings,
    studyB.analysis.key_findings
  );

  const overall = computeOverall(measurementDiffs, keyFindingDiffs);

  return {
    comparable: true,
    measurementDiffs,
    keyFindingDiffs,
    overall,
  };
}

// Re-exportar parseNumericValue para tests y uso externo
export { parseNumericValue };
