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

// ── 10 casos solicitados ──────────────────────────────────────

describe("10 casos de validación", () => {
  it("1. objeto válido completo → aceptado", () => {
    const result = parseStudyAnalysis(VALID_ANALYSIS);
    assert.equal(result.summary, VALID_ANALYSIS.summary);
    assert.equal(result.key_findings.length, 1);
    assert.equal(result.key_findings[0].status, "normal");
  });

  it("2. falta summary → rechazado", () => {
    const { summary: _removed, ...noSummary } = VALID_ANALYSIS;
    const result = safeParseStudyAnalysis(noSummary);
    assert.equal(result.success, false);
  });

  it("3. status fuera del enum → rechazado", () => {
    const invalid = {
      ...VALID_ANALYSIS,
      key_findings: [{ ...VALID_ANALYSIS.key_findings[0], status: "critical" }],
    };
    const result = safeParseStudyAnalysis(invalid);
    assert.equal(result.success, false);
  });

  it("4. unit: null y reference_range: null → aceptado", () => {
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

  it("5. arrays vacíos → aceptado", () => {
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

  it("6. key_findings como string en vez de array → rechazado", () => {
    const invalid = { ...VALID_ANALYSIS, key_findings: "not an array" };
    const result = safeParseStudyAnalysis(invalid);
    assert.equal(result.success, false);
  });

  it("7. key_findings sin explanation → rechazado", () => {
    const invalid = {
      ...VALID_ANALYSIS,
      key_findings: [
        {
          title: "Glucosa",
          value: "95",
          unit: "mg/dL",
          reference_range: "70-110",
          status: "normal",
        },
      ],
    };
    const result = safeParseStudyAnalysis(invalid);
    assert.equal(result.success, false);
  });

  it("8. status: unknown → aceptado", () => {
    const withUnknown = {
      ...VALID_ANALYSIS,
      key_findings: [
        {
          title: "Observación",
          value: "Detalle mencionado",
          unit: null,
          reference_range: null,
          status: "unknown" as const,
          explanation: "Sin referencia disponible.",
        },
      ],
    };
    const result = parseStudyAnalysis(withUnknown);
    assert.equal(result.key_findings[0].status, "unknown");
  });

  it("9. objeto vacío {} → rechazado", () => {
    const result = safeParseStudyAnalysis({});
    assert.equal(result.success, false);
  });

  it("10. null → rechazado", () => {
    const result = safeParseStudyAnalysis(null);
    assert.equal(result.success, false);
  });
});

// ── Verificación de helpers ────────────────────────────────────

describe("parseStudyAnalysis", () => {
  it("objeto válido → devuelve el objeto tipado", () => {
    const result = parseStudyAnalysis(VALID_ANALYSIS);
    assert.equal(typeof result.summary, "string");
    assert.ok(Array.isArray(result.key_findings));
  });

  it("objeto inválido → lanza ZodError", () => {
    assert.throws(
      () => parseStudyAnalysis({}),
      (err: unknown) => err instanceof Error && err.name === "ZodError"
    );
  });
});

describe("safeParseStudyAnalysis", () => {
  it("objeto válido → success: true", () => {
    const result = safeParseStudyAnalysis(VALID_ANALYSIS);
    assert.equal(result.success, true);
  });

  it("objeto inválido → success: false con error", () => {
    const result = safeParseStudyAnalysis({ invalid: true });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.length > 0);
    }
  });
});
