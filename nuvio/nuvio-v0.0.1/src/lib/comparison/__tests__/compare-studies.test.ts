import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseStudyAnalysis } from "../../analysis/schema.ts";
import {
  compareStudies,
  isComparable,
  compareMeasurements,
  compareKeyFindings,
  parseNumericValue,
} from "../compare-studies.ts";
import type { StudyForComparison } from "../types.ts";
import type {
  MeasurementComparable,
  MeasurementDiff,
  ComparisonResult,
  ComparisonIncompatibility,
} from "../types.ts";

// ── Helpers ──────────────────────────────────────────────

/**
 * Type predicate sobre la unión de diffs: reduce a la variante "comparable".
 * Funciona tanto para MeasurementDiff como para KeyFindingDiff.
 */
function isComparableDiff<T extends { status: string }>(
  diff: T
): diff is Extract<T, { status: "comparable" }> {
  return diff.status === "comparable";
}

function comparableOf(diff: MeasurementDiff): MeasurementComparable | undefined {
  return diff.status === "comparable" ? diff : undefined;
}

function incompatibilityOf(result: ComparisonResult): ComparisonIncompatibility {
  if (result.comparable) throw new Error("Se esperaba un resultado no comparable");
  return result.incompatibility;
}

function makeStudy(
  analysis: ReturnType<typeof parseStudyAnalysis>,
  analysisStatus: StudyForComparison["analysisStatus"]
): StudyForComparison {
  return { analysis, analysisStatus };
}

function studyA(): StudyForComparison {
  return makeStudy(
    parseStudyAnalysis({
      summary: "Análisis de sangre completo.",
      document_type: "Análisis de sangre",
      study_type: "blood_test",
      key_findings: [
        { title: "Glucosa elevada", explanation: "Glucosa por encima del rango.", importance: "high" },
        { title: "Hemoglobina normal", explanation: "Hemoglobina dentro del rango.", importance: "normal" },
      ],
      measurements: [
        { name: "Glucosa", value: "95", unit: "mg/dL", reference_range: "70-110", status: "within_range" as const },
        { name: "Hemoglobina", value: "14.2", unit: "g/dL", reference_range: "13.0-17.0", status: "within_range" as const },
      ],
      observations: [],
      warnings: [],
      recommendations: [],
      limitations: [],
    }),
    "completed"
  );
}

function studyB(): StudyForComparison {
  return makeStudy(
    parseStudyAnalysis({
      summary: "Control de sangre posterior.",
      document_type: "Análisis de sangre",
      study_type: "blood_test",
      key_findings: [
        { title: "Glucosa elevada", explanation: "Glucosa aún elevada.", importance: "high" },
        { title: "Hemoglobina normal", explanation: "Hemoglobina estable.", importance: "normal" },
        { title: "Colesterol nuevo", explanation: "Colesterol ligeramente alto.", importance: "low" },
      ],
      measurements: [
        { name: "Glucosa", value: "123", unit: "mg/dL", reference_range: "70-110", status: "above_range" as const },
        { name: "Hemoglobina", value: "14.2", unit: "g/dL", reference_range: "13.0-17.0", status: "within_range" as const },
        { name: "Triglicéridos", value: "150", unit: "mg/dL", reference_range: "50-150", status: "within_range" as const },
      ],
      observations: [],
      warnings: [],
      recommendations: [],
      limitations: [],
    }),
    "completed"
  );
}

// ── parseNumericValue ────────────────────────────────────

describe("parseNumericValue", () => {
  it("cadena entera → número", () => {
    assert.equal(parseNumericValue("123"), 123);
  });

  it("cadena decimal → número", () => {
    assert.equal(parseNumericValue("14.2"), 14.2);
  });

  it("cadena con espacios → recorta y parsea", () => {
    assert.equal(parseNumericValue(" 95 "), 95);
  });

  it("cadena negativa → número negativo", () => {
    assert.equal(parseNumericValue("-5"), -5);
  });

  it("valor con unidad → null", () => {
    assert.equal(parseNumericValue("123 mg/dL"), null);
  });

  it("valor elevado → null", () => {
    assert.equal(parseNumericValue("elevado"), null);
  });

  it("valor normal → null", () => {
    assert.equal(parseNumericValue("normal"), null);
  });

  it("valor negativo → null", () => {
    assert.equal(parseNumericValue("negativo"), null);
  });

  it("cadena vacía → null", () => {
    assert.equal(parseNumericValue(""), null);
  });

  it("solo espacios → null", () => {
    assert.equal(parseNumericValue("   "), null);
  });

  it("undefined → null", () => {
    assert.equal(parseNumericValue(undefined as unknown as string), null);
  });

  it("decimal con múltiples puntos → null", () => {
    assert.equal(parseNumericValue("12.3.4"), null);
  });

  it("letras con números → null", () => {
    assert.equal(parseNumericValue("abc123"), null);
  });
});

// ── isComparable ─────────────────────────────────────────

describe("isComparable", () => {
  it("estudios compatibles → null", () => {
    const result = isComparable(studyA(), studyB());
    assert.equal(result, null);
  });

  it("estudio A no completado → incompatibilidad not_completed", () => {
    const a = makeStudy(studyA().analysis, "processing");
    const result = isComparable(a, studyB());
    assert.notEqual(result, null);
    assert.equal(result!.kind, "not_completed");
  });

  it("estudio B no completado → incompatibilidad not_completed", () => {
    const b = makeStudy(studyB().analysis, "failed");
    const result = isComparable(studyA(), b);
    assert.notEqual(result, null);
    assert.equal(result!.kind, "not_completed");
  });

  it("ambos no completados → not_completed", () => {
    const a = makeStudy(studyA().analysis, "pending");
    const b = makeStudy(studyB().analysis, "processing");
    const result = isComparable(a, b);
    assert.notEqual(result, null);
    assert.equal(result!.kind, "not_completed");
  });

  it("estudio A con study_type null → missing_study_type", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        ...studyA().analysis,
        study_type: null,
      }),
      "completed"
    );
    const result = isComparable(a, studyB());
    assert.notEqual(result, null);
    assert.equal(result!.kind, "missing_study_type");
  });

  it("estudio B con study_type null → missing_study_type", () => {
    const b = makeStudy(
      parseStudyAnalysis({
        ...studyB().analysis,
        study_type: null,
      }),
      "completed"
    );
    const result = isComparable(studyA(), b);
    assert.notEqual(result, null);
    assert.equal(result!.kind, "missing_study_type");
  });

  it("diferente study_type → different_study_type", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        ...studyA().analysis,
        study_type: "blood_test",
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        ...studyB().analysis,
        study_type: "MRI",
      }),
      "completed"
    );
    const result = isComparable(a, b);
    assert.notEqual(result, null);
    assert.equal(result!.kind, "different_study_type");
  });

  it("estudio A con summary vacío → empty_analysis", () => {
    const a = makeStudy(
      { ...studyA().analysis, summary: "" } as ReturnType<typeof parseStudyAnalysis>,
      "completed"
    );
    const result = isComparable(a, studyB());
    assert.notEqual(result, null);
    assert.equal(result!.kind, "empty_analysis");
  });

  it("estudio B con summary vacío → empty_analysis", () => {
    const b = makeStudy(
      { ...studyB().analysis, summary: "" } as ReturnType<typeof parseStudyAnalysis>,
      "completed"
    );
    const result = isComparable(studyA(), b);
    assert.notEqual(result, null);
    assert.equal(result!.kind, "empty_analysis");
  });

  it("ambos con summary vacío → empty_analysis", () => {
    const a = makeStudy(
      { ...studyA().analysis, summary: "" } as ReturnType<typeof parseStudyAnalysis>,
      "completed"
    );
    const b = makeStudy(
      { ...studyB().analysis, summary: "" } as ReturnType<typeof parseStudyAnalysis>,
      "completed"
    );
    const result = isComparable(a, b);
    assert.notEqual(result, null);
    assert.equal(result!.kind, "empty_analysis");
  });
});

// ── compareMeasurements ──────────────────────────────────

describe("compareMeasurements", () => {
  it("parámetro con valor aumentado", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "95" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "123" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareMeasurements(a.analysis.measurements, b.analysis.measurements);
    const comparable = diffs.find(isComparableDiff);
    assert.ok(comparable);
    assert.equal(comparable.valueDiff.kind, "both_numeric");
    assert.equal(comparable.valueDiff.direction, "increased");
    assert.equal(comparable.valueDiff.absoluteDifference, 28);
  });

  it("parámetro con valor disminuido", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "123" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "95" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareMeasurements(a.analysis.measurements, b.analysis.measurements);
    const comparable = diffs.find(isComparableDiff);
    assert.ok(comparable);
    assert.equal(comparable.valueDiff.direction, "decreased");
  });

  it("parámetro estable (valores iguales)", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "95" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "95" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareMeasurements(a.analysis.measurements, b.analysis.measurements);
    const comparable = diffs.find(isComparableDiff);
    assert.ok(comparable);
    assert.equal(comparable.valueDiff.direction, "stable");
    assert.equal(comparable.valueDiff.percentageChange, 0);
  });

  it("parámetro nuevo en B", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "95" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [
          { name: "Glucosa", value: "95" },
          { name: "Triglicéridos", value: "150" },
        ],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareMeasurements(a.analysis.measurements, b.analysis.measurements);
    const newParam = diffs.find((d) => d.status === "new");
    assert.ok(newParam);
    assert.equal(newParam.name, "Triglicéridos");
  });

  it("parámetro ausente en B", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [
          { name: "Glucosa", value: "95" },
          { name: "Colesterol", value: "200" },
        ],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "95" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareMeasurements(a.analysis.measurements, b.analysis.measurements);
    const missingParam = diffs.find((d) => d.status === "missing");
    assert.ok(missingParam);
    assert.equal(missingParam.name, "Colesterol");
  });

  it("unidad diferente → unitMismatch", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "95", unit: "mg/dL" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "5.6", unit: "mmol/L" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareMeasurements(a.analysis.measurements, b.analysis.measurements);
    const comparable = comparableOf(diffs.find((d) => d.status === "comparable")!);
    assert.ok(comparable);
    assert.equal(comparable.unitMismatch.hasMismatch, true);
    assert.equal(comparable.unitMismatch.previousUnit, "mg/dL");
    assert.equal(comparable.unitMismatch.currentUnit, "mmol/L");
    // Sin conversión de unidades: valores numéricos con unidades distintas → not_comparable
    assert.equal(comparable.valueDiff.kind, "not_comparable");
  });

  it("unidades distintas → valor not_comparable (sin conversión)", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "5", unit: "mmol/L" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "90", unit: "mg/dL" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareMeasurements(a.analysis.measurements, b.analysis.measurements);
    const comparable = comparableOf(diffs[0]);
    assert.ok(comparable);
    assert.equal(comparable.valueDiff.kind, "not_comparable");
  });

  it("ambos sin unidad → comparable (unidad ausente no bloquea)", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "95", unit: null }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "123", unit: undefined }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareMeasurements(a.analysis.measurements, b.analysis.measurements);
    const comparable = comparableOf(diffs[0]);
    assert.ok(comparable);
    // null y undefined se tratan como "sin unidad": sin mismatch
    assert.equal(comparable.unitMismatch.hasMismatch, false);
    assert.equal(comparable.valueDiff.kind, "both_numeric");
    assert.equal(comparable.valueDiff.direction, "increased");
  });

  it("unidad presente solo en un estudio → not_comparable", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "95" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "5.6", unit: "mmol/L" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareMeasurements(a.analysis.measurements, b.analysis.measurements);
    const comparable = comparableOf(diffs[0]);
    assert.ok(comparable);
    assert.equal(comparable.unitMismatch.hasMismatch, true);
    assert.equal(comparable.valueDiff.kind, "not_comparable");
  });

  it("misma unidad → sin unitMismatch", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "95", unit: "mg/dL" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "123", unit: "mg/dL" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareMeasurements(a.analysis.measurements, b.analysis.measurements);
    const comparable = diffs.find(isComparableDiff);
    assert.ok(comparable);
    assert.equal(comparable.unitMismatch.hasMismatch, false);
  });

  it("valor no numérico en ambos → both_non_numeric", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "elevado" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "normal" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareMeasurements(a.analysis.measurements, b.analysis.measurements);
    const comparable = diffs.find(isComparableDiff);
    assert.ok(comparable);
    assert.equal(comparable.valueDiff.kind, "both_non_numeric");
  });

  it("valor numérico en A, no numérico en B → one_numeric", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "95" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "elevado" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareMeasurements(a.analysis.measurements, b.analysis.measurements);
    const comparable = diffs.find(isComparableDiff);
    assert.ok(comparable);
    assert.equal(comparable.valueDiff.kind, "one_numeric");
  });

  it("status cambiado → statusDiff.changed", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "95", status: "within_range" as const }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "123", status: "above_range" as const }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareMeasurements(a.analysis.measurements, b.analysis.measurements);
    const comparable = diffs.find(isComparableDiff);
    assert.ok(comparable);
    assert.equal(comparable.statusDiff.changed, true);
    assert.equal(comparable.statusDiff.previousStatus, "within_range");
    assert.equal(comparable.statusDiff.currentStatus, "above_range");
  });

  it("status igual → statusDiff.changed = false", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "95", status: "within_range" as const }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "123", status: "within_range" as const }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareMeasurements(a.analysis.measurements, b.analysis.measurements);
    const comparable = diffs.find(isComparableDiff);
    assert.ok(comparable);
    assert.equal(comparable.statusDiff.changed, false);
  });

  it("reference_range diferente → referenceRangeDiff.changed", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "95", reference_range: "70-110" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "123", reference_range: "80-130" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareMeasurements(a.analysis.measurements, b.analysis.measurements);
    const comparable = diffs.find(isComparableDiff);
    assert.ok(comparable);
    assert.equal(comparable.referenceRangeDiff.changed, true);
  });

  it("reference_range igual → referenceRangeDiff.changed = false", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "95", reference_range: "70-110" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "123", reference_range: "70-110" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareMeasurements(a.analysis.measurements, b.analysis.measurements);
    const comparable = diffs.find(isComparableDiff);
    assert.ok(comparable);
    assert.equal(comparable.referenceRangeDiff.changed, false);
  });

  it("reference_range null vs undefined → sin cambio (ambos ausentes)", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "95", reference_range: null }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "123" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareMeasurements(a.analysis.measurements, b.analysis.measurements);
    const comparable = comparableOf(diffs[0]);
    assert.ok(comparable);
    assert.equal(comparable.referenceRangeDiff.changed, false);
    assert.equal(comparable.referenceRangeDiff.previousRange, undefined);
    assert.equal(comparable.referenceRangeDiff.currentRange, undefined);
  });

  it("valor con percentageChange y division por cero → null", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "0" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "5" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareMeasurements(a.analysis.measurements, b.analysis.measurements);
    const comparable = diffs.find(isComparableDiff);
    assert.ok(comparable);
    assert.equal(comparable.valueDiff.percentageChange, null);
    assert.equal(comparable.valueDiff.direction, "increased");
    assert.equal(comparable.valueDiff.absoluteDifference, 5);
  });

  it("arrays vacíos → array vacío", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareMeasurements(a.analysis.measurements, b.analysis.measurements);
    assert.equal(diffs.length, 0);
  });

  it("múltiples mediciones comparables", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [
          { name: "Glucosa", value: "95" },
          { name: "Colesterol", value: "200" },
        ],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [
          { name: "Glucosa", value: "123" },
          { name: "Colesterol", value: "180" },
        ],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareMeasurements(a.analysis.measurements, b.analysis.measurements);
    assert.equal(diffs.length, 2);
    const comparable = diffs.filter((d) => d.status === "comparable");
    assert.equal(comparable.length, 2);
  });

  it("mezcla de aumentados, disminuidos, estables, nuevos y ausentes", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [
          { name: "Glucosa", value: "95" },
          { name: "Hemoglobina", value: "14.2" },
          { name: "Colesterol", value: "200" },
          { name: "Urea", value: "30" },
        ],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [
          { name: "Glucosa", value: "123" },
          { name: "Hemoglobina", value: "14.2" },
          { name: "Colesterol", value: "180" },
          { name: "Triglicéridos", value: "150" },
        ],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareMeasurements(a.analysis.measurements, b.analysis.measurements);
    assert.equal(diffs.length, 5);

    const comparables = diffs
      .map(comparableOf)
      .filter((c): c is MeasurementComparable => c !== undefined);
    assert.equal(comparables.length, 3);
    const increased = comparables.filter(
      (c) => c.valueDiff.kind === "both_numeric" && c.valueDiff.direction === "increased"
    ).length;
    const decreased = comparables.filter(
      (c) => c.valueDiff.kind === "both_numeric" && c.valueDiff.direction === "decreased"
    ).length;
    const stable = comparables.filter(
      (c) => c.valueDiff.kind === "both_numeric" && c.valueDiff.direction === "stable"
    ).length;
    assert.equal(increased, 1);
    assert.equal(decreased, 1);
    assert.equal(stable, 1);

    const newParams = diffs.filter((d) => d.status === "new");
    const missingParams = diffs.filter((d) => d.status === "missing");
    assert.equal(newParams.length, 1);
    assert.equal(newParams[0].name, "Triglicéridos");
    assert.equal(missingParams.length, 1);
    assert.equal(missingParams[0].name, "Urea");
  });

  it("valor undefined → treated as empty string", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: undefined as unknown as string }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "95" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareMeasurements(a.analysis.measurements, b.analysis.measurements);
    const comparable = diffs.find(isComparableDiff);
    assert.ok(comparable);
    assert.equal(comparable.previousValue, "");
    assert.equal(comparable.valueDiff.kind, "one_numeric");
  });
});

// ── compareKeyFindings ───────────────────────────────────

describe("compareKeyFindings", () => {
  it("finding con importance estable", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [{ title: "Glucosa elevada", explanation: "Detalle A", importance: "high" }],
        measurements: [],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [{ title: "Glucosa elevada", explanation: "Detalle B", importance: "high" }],
        measurements: [],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareKeyFindings(a.analysis.key_findings, b.analysis.key_findings);
    const comparable = diffs.find(isComparableDiff);
    assert.ok(comparable);
    assert.equal(comparable.importanceChanged, false);
  });

  it("finding con importance modificada", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [{ title: "Glucosa elevada", explanation: "Detalle A", importance: "high" }],
        measurements: [],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [{ title: "Glucosa elevada", explanation: "Detalle B", importance: "normal" }],
        measurements: [],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareKeyFindings(a.analysis.key_findings, b.analysis.key_findings);
    const comparable = diffs.find(isComparableDiff);
    assert.ok(comparable);
    assert.equal(comparable.importanceChanged, true);
  });

  it("finding nuevo en B", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [{ title: "Hallazgo A", explanation: "Detalle A" }],
        measurements: [],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [
          { title: "Hallazgo A", explanation: "Detalle A" },
          { title: "Hallazgo Nuevo", explanation: "Detalle B" },
        ],
        measurements: [],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareKeyFindings(a.analysis.key_findings, b.analysis.key_findings);
    const newFinding = diffs.find((d) => d.status === "new");
    assert.ok(newFinding);
    assert.equal(newFinding.title, "Hallazgo Nuevo");
  });

  it("finding ausente en B", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [
          { title: "Hallazgo A", explanation: "Detalle A" },
          { title: "Hallazgo Viejo", explanation: "Detalle B" },
        ],
        measurements: [],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [{ title: "Hallazgo A", explanation: "Detalle A" }],
        measurements: [],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareKeyFindings(a.analysis.key_findings, b.analysis.key_findings);
    const missingFinding = diffs.find((d) => d.status === "missing");
    assert.ok(missingFinding);
    assert.equal(missingFinding.title, "Hallazgo Viejo");
  });

  it("finding sin importance → importanceChanged = false cuando ambos undefined", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [{ title: "Hallazgo A", explanation: "Detalle A" }],
        measurements: [],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [{ title: "Hallazgo A", explanation: "Detalle B" }],
        measurements: [],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareKeyFindings(a.analysis.key_findings, b.analysis.key_findings);
    const comparable = diffs.find(isComparableDiff);
    assert.ok(comparable);
    assert.equal(comparable.importanceChanged, false);
    assert.equal(comparable.previousImportance, undefined);
    assert.equal(comparable.currentImportance, undefined);
  });

  it("arrays vacíos → array vacío", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareKeyFindings(a.analysis.key_findings, b.analysis.key_findings);
    assert.equal(diffs.length, 0);
  });

  it("múltiples findings con mezcla de nuevos/ausentes/estables", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [
          { title: "Hallazgo A", explanation: "Detalle A", importance: "high" },
          { title: "Hallazgo B", explanation: "Detalle B", importance: "low" },
          { title: "Hallazgo C", explanation: "Detalle C" },
        ],
        measurements: [],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [
          { title: "Hallazgo A", explanation: "Detalle A'", importance: "normal" },
          { title: "Hallazgo D", explanation: "Detalle D" },
        ],
        measurements: [],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const diffs = compareKeyFindings(a.analysis.key_findings, b.analysis.key_findings);
    assert.equal(diffs.length, 4);
    const comparable = diffs.filter((d) => d.status === "comparable");
    const newFinding = diffs.filter((d) => d.status === "new");
    const missingFinding = diffs.filter((d) => d.status === "missing");
    assert.equal(comparable.length, 1);
    assert.equal(newFinding.length, 1);
    assert.equal(missingFinding.length, 2);
  });
});

// ── compareStudies (integración) ─────────────────────────

describe("compareStudies", () => {
  it("comparación exitosa con diffs en ambos arrays", () => {
    const result = compareStudies(studyA(), studyB());
    assert.equal(result.comparable, true);
    assert.ok("measurementDiffs" in result);
    assert.ok("keyFindingDiffs" in result);
    assert.ok("overall" in result);
  });

  it("no comparable cuando analysis_status es processing", () => {
    const a = makeStudy(studyA().analysis, "processing");
    const result = compareStudies(a, studyB());
    assert.equal(result.comparable, false);
    assert.ok("incompatibility" in result);
    assert.equal(incompatibilityOf(result).kind, "not_completed");
  });

  it("no comparable cuando study_type es diferente", () => {
    const b = makeStudy(
      parseStudyAnalysis({
        ...studyB().analysis,
        study_type: "MRI",
      }),
      "completed"
    );
    const result = compareStudies(studyA(), b);
    assert.equal(result.comparable, false);
    assert.equal(incompatibilityOf(result).kind, "different_study_type");
  });

  it("no comparable cuando study_type es null", () => {
    const b = makeStudy(
      parseStudyAnalysis({
        ...studyB().analysis,
        study_type: null,
      }),
      "completed"
    );
    const result = compareStudies(studyA(), b);
    assert.equal(result.comparable, false);
    assert.equal(incompatibilityOf(result).kind, "missing_study_type");
  });

  it("no comparable cuando summary está vacío", () => {
    const b = makeStudy(
      { ...studyB().analysis, summary: "" } as ReturnType<typeof parseStudyAnalysis>,
      "completed"
    );
    const result = compareStudies(studyA(), b);
    assert.equal(result.comparable, false);
    assert.equal(incompatibilityOf(result).kind, "empty_analysis");
  });

  it("resultado con mediciones comparables, nuevas y ausentes", () => {
    const result = compareStudies(studyA(), studyB());
    assert.equal(result.comparable, true);
    const measurementDiffs = result.measurementDiffs;
    const comparable = measurementDiffs.filter((d) => d.status === "comparable");
    const newParams = measurementDiffs.filter((d) => d.status === "new");
    const missing = measurementDiffs.filter((d) => d.status === "missing");
    assert.equal(comparable.length, 2);
    assert.equal(newParams.length, 1);
    assert.equal(missing.length, 0);
  });

  it("resultado con hallazgos comparables, nuevos y ausentes", () => {
    const result = compareStudies(studyA(), studyB());
    assert.equal(result.comparable, true);
    const keyFindingDiffs = result.keyFindingDiffs;
    const comparable = keyFindingDiffs.filter((d) => d.status === "comparable");
    const newFindings = keyFindingDiffs.filter((d) => d.status === "new");
    const missing = keyFindingDiffs.filter((d) => d.status === "missing");
    assert.equal(comparable.length, 2);
    assert.equal(newFindings.length, 1);
    assert.equal(missing.length, 0);
  });

  it("overall con resumen numérico correcto", () => {
    const result = compareStudies(studyA(), studyB());
    assert.equal(result.comparable, true);
    const overall = result.overall;
    assert.ok(overall.numericSummary.comparableCount >= 0);
    assert.ok("newParametersCount" in overall);
    assert.ok("missingParametersCount" in overall);
    assert.ok("newFindingsCount" in overall);
    assert.ok("missingFindingsCount" in overall);
  });

  it("direction increased cuando valor sube", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "X", value: "10" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "X", value: "20" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const result = compareStudies(a, b);
    assert.equal(result.comparable, true);
    const comparable = comparableOf(result.measurementDiffs[0])!;
    assert.equal(comparable.valueDiff.direction, "increased");
  });

  it("direction decreased cuando valor baja", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "X", value: "20" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "X", value: "10" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const result = compareStudies(a, b);
    assert.equal(result.comparable, true);
    const comparable = comparableOf(result.measurementDiffs[0])!;
    assert.equal(comparable.valueDiff.direction, "decreased");
  });

  it("integración: unidades distintas → comparable pero valor not_comparable", () => {
    const a = makeStudy(
      parseStudyAnalysis({
        summary: "Test A.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "5", unit: "mmol/L" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const b = makeStudy(
      parseStudyAnalysis({
        summary: "Test B.",
        document_type: "Test",
        study_type: "blood_test",
        key_findings: [],
        measurements: [{ name: "Glucosa", value: "90", unit: "mg/dL" }],
        observations: [], warnings: [], recommendations: [], limitations: [],
      }),
      "completed"
    );
    const result = compareStudies(a, b);
    assert.equal(result.comparable, true);
    const comparable = comparableOf(result.measurementDiffs[0]);
    assert.ok(comparable);
    assert.equal(comparable.valueDiff.kind, "not_comparable");
    assert.equal(result.overall.numericSummary.notComparableCount, 1);
    assert.equal(result.overall.numericSummary.increasedCount, 0);
  });
});

// ── Casos basados en formatos reales del proyecto ────────

describe("formatos reales de valores", () => {
  it("valor entero '123' → parseable", () => {
    assert.equal(parseNumericValue("123"), 123);
  });

  it("valor decimal '14.2' → parseable", () => {
    assert.equal(parseNumericValue("14.2"), 14.2);
  });

  it("valor con 'mg/dL' → null (no automáticamente válido)", () => {
    assert.equal(parseNumericValue("123 mg/dL"), null);
  });

  it("valor con espacios internos → null", () => {
    assert.equal(parseNumericValue("123 456"), null);
  });
});
