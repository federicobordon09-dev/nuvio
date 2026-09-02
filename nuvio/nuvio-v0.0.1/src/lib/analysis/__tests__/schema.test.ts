import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseStudyAnalysis, safeParseStudyAnalysis } from "../schema.ts";

const VALID_ANALYSIS = {
  summary: "Análisis de sangre completo con valores generales dentro de parámetros normales.",
  document_type: "Análisis de sangre",
  key_findings: [
    {
      title: "Glucosa",
      value: "95",
      unit: "mg/dL",
      reference_range: "70-110",
      status: "normal" as const,
      explanation: "Glucosa dentro del rango normal.",
    },
  ],
  observations: ["Se observan valores dentro de parámetros normales."],
  warnings: [],
  recommendations: ["Mantener hábitos saludables."],
  limitations: ["No se dispone de historia clínica previa."],
};

describe("StudyAnalysisSchema", () => {
  it("acepta un objeto válido completo", () => {
    const result = parseStudyAnalysis(VALID_ANALYSIS);
    assert.equal(result.summary, VALID_ANALYSIS.summary);
    assert.equal(result.key_findings.length, 1);
    assert.equal(result.key_findings[0].status, "normal");
  });

  it("rechaza status fuera del enum", () => {
    const invalid = {
      ...VALID_ANALYSIS,
      key_findings: [{ ...VALID_ANALYSIS.key_findings[0], status: "critical" }],
    };
    const result = safeParseStudyAnalysis(invalid);
    assert.equal(result.success, false);
  });

  it("rechaza campo obligatorio faltante (summary)", () => {
    const { summary: _removed, ...noSummary } = VALID_ANALYSIS;
    const result = safeParseStudyAnalysis(noSummary);
    assert.equal(result.success, false);
  });

  it("acepta unit: null y reference_range: null", () => {
    const withNulls = {
      ...VALID_ANALYSIS,
      key_findings: [
        {
          title: "Hemoglobina",
          value: "14.2",
          unit: null,
          reference_range: null,
          status: "normal" as const,
          explanation: "Valor normal.",
        },
      ],
    };
    const result = parseStudyAnalysis(withNulls);
    assert.equal(result.key_findings[0].unit, null);
    assert.equal(result.key_findings[0].reference_range, null);
  });

  it("acepta arrays vacíos", () => {
    const empty = {
      summary: "Documento procesado.",
      document_type: "Informe médico",
      key_findings: [],
      observations: [],
      warnings: [],
      recommendations: [],
      limitations: [],
    };
    const result = parseStudyAnalysis(empty);
    assert.equal(result.key_findings.length, 0);
    assert.equal(result.warnings.length, 0);
  });
});
