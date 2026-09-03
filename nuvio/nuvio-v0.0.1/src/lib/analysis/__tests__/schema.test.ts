import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseStudyAnalysis, safeParseStudyAnalysis, normalizeLegacyAnalysis } from "../schema.ts";

const VALID_ANALYSIS = {
  summary: "Análisis de sangre completo con valores generales dentro de parámetros normales.",
  document_type: "Análisis de sangre",
  study_type: "blood_test",
  key_findings: [
    {
      title: "Glucosa en rango",
      explanation: "Glucosa dentro del rango normal.",
      importance: "normal" as const,
    },
  ],
  measurements: [
    {
      name: "Glucosa",
      value: "95",
      unit: "mg/dL",
      reference_range: "70-110",
      status: "within_range" as const,
    },
  ],
  observations: ["Se observan valores dentro de parámetros normales."],
  warnings: [],
  recommendations: ["Mantener hábitos saludables."],
  limitations: ["No se dispone de historia clínica previa."],
};

// ── Tests del schema nuevo ──────────────────────────────────────

describe("Schema nuevo — análisis válido", () => {
  it("1. objeto válido completo → aceptado", () => {
    const result = parseStudyAnalysis(VALID_ANALYSIS);
    assert.equal(result.summary, VALID_ANALYSIS.summary);
    assert.equal(result.key_findings.length, 1);
    assert.equal(result.key_findings[0].importance, "normal");
    assert.equal(result.measurements.length, 1);
    assert.equal(result.measurements[0].status, "within_range");
  });

  it("2. falta summary → rechazado", () => {
    const { summary: _removed, ...noSummary } = VALID_ANALYSIS;
    const result = safeParseStudyAnalysis(noSummary);
    assert.equal(result.success, false);
  });

  it("3. importance fuera del enum → rechazado", () => {
    const invalid = {
      ...VALID_ANALYSIS,
      key_findings: [{ ...VALID_ANALYSIS.key_findings[0], importance: "critical" }],
    };
    const result = safeParseStudyAnalysis(invalid);
    assert.equal(result.success, false);
  });

  it("4. measurement sin unit → aceptado", () => {
    const withNulls = {
      ...VALID_ANALYSIS,
      measurements: [
        {
          name: "Hemoglobina",
          value: "14.2",
        },
      ],
    };
    const result = parseStudyAnalysis(withNulls);
    assert.equal(result.measurements.length, 1);
    assert.equal(result.measurements[0].unit, undefined);
  });

  it("5. arrays vacíos → aceptado", () => {
    const empty = {
      summary: "Documento procesado.",
      document_type: "Informe médico",
      study_type: "medical_report",
      key_findings: [],
      measurements: [],
      observations: [],
      warnings: [],
      recommendations: [],
      limitations: [],
    };
    const result = parseStudyAnalysis(empty);
    assert.equal(result.key_findings.length, 0);
    assert.equal(result.measurements.length, 0);
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
        },
      ],
    };
    const result = safeParseStudyAnalysis(invalid);
    assert.equal(result.success, false);
  });

  it("8. measurement status: unknown → aceptado", () => {
    const withUnknown = {
      ...VALID_ANALYSIS,
      measurements: [
        {
          name: "Observación",
          status: "unknown" as const,
        },
      ],
    };
    const result = parseStudyAnalysis(withUnknown);
    assert.equal(result.measurements[0].status, "unknown");
  });

  it("9. objeto vacío {} → rechazado", () => {
    const result = safeParseStudyAnalysis({});
    assert.equal(result.success, false);
  });

  it("10. null → rechazado", () => {
    const result = safeParseStudyAnalysis(null);
    assert.equal(result.success, false);
  });

  it("11. study_type válido (blood_test) → aceptado", () => {
    const result = parseStudyAnalysis(VALID_ANALYSIS);
    assert.equal(result.study_type, "blood_test");
  });

  it("12. study_type fuera del enum → rechazado", () => {
    const invalid = { ...VALID_ANALYSIS, study_type: "x_ray" };
    const result = safeParseStudyAnalysis(invalid);
    assert.equal(result.success, false);
  });

  it("13. study_type null → aceptado (pre-análisis)", () => {
    const withNullStudyType = { ...VALID_ANALYSIS, study_type: null };
    const result = parseStudyAnalysis(withNullStudyType);
    assert.equal(result.study_type, null);
  });

  it("14. study_type 'other' → aceptado", () => {
    const result = parseStudyAnalysis({ ...VALID_ANALYSIS, study_type: "other" });
    assert.equal(result.study_type, "other");
  });
});

describe("Measurements — tests específicos", () => {
  it("measurement completo con todos los campos", () => {
    const result = parseStudyAnalysis({
      ...VALID_ANALYSIS,
      measurements: [
        {
          name: "Hemoglobina",
          value: "13.2",
          unit: "g/dL",
          reference_range: "12-16",
          status: "within_range",
        },
      ],
    });
    assert.equal(result.measurements[0].name, "Hemoglobina");
    assert.equal(result.measurements[0].value, "13.2");
    assert.equal(result.measurements[0].unit, "g/dL");
    assert.equal(result.measurements[0].reference_range, "12-16");
    assert.equal(result.measurements[0].status, "within_range");
  });

  it("measurement sin unit", () => {
    const result = parseStudyAnalysis({
      ...VALID_ANALYSIS,
      measurements: [{ name: "Glasgow", value: "15" }],
    });
    assert.equal(result.measurements[0].unit, undefined);
  });

  it("measurement sin reference_range", () => {
    const result = parseStudyAnalysis({
      ...VALID_ANALYSIS,
      measurements: [{ name: "Glasgow", value: "15" }],
    });
    assert.equal(result.measurements[0].reference_range, undefined);
  });

  it("measurement sin status", () => {
    const result = parseStudyAnalysis({
      ...VALID_ANALYSIS,
      measurements: [{ name: "Glasgow", value: "15" }],
    });
    assert.equal(result.measurements[0].status, undefined);
  });

  it("documento sin measurements → defaulta a []", () => {
    const noMeasurements = {
      summary: "Informe de imágenes.",
      document_type: "RMN",
      study_type: "MRI",
      key_findings: [],
      observations: [],
      warnings: [],
      recommendations: [],
      limitations: [],
    };
    const result = parseStudyAnalysis(noMeasurements);
    assert.deepEqual(result.measurements, []);
  });

  it("measurements vacío → aceptado", () => {
    const result = parseStudyAnalysis({
      ...VALID_ANALYSIS,
      measurements: [],
    });
    assert.equal(result.measurements.length, 0);
  });
});

describe("Key findings — tests del nuevo formato", () => {
  it("finding simplificado con importance", () => {
    const result = parseStudyAnalysis({
      ...VALID_ANALYSIS,
      key_findings: [
        {
          title: "Opacidad en lóbulo superior",
          explanation: "Se observa una opacidad que requiere evaluación.",
          importance: "high",
        },
      ],
    });
    assert.equal(result.key_findings[0].importance, "high");
  });

  it("finding sin importance → aceptado", () => {
    const result = parseStudyAnalysis({
      ...VALID_ANALYSIS,
      key_findings: [
        {
          title: "Observación general",
          explanation: "Detalle mencionado en el informe.",
        },
      ],
    });
    assert.equal(result.key_findings[0].importance, undefined);
  });
});

describe("Legacy normalization", () => {
  it("15. análisis legacy con value/status → se normaliza", () => {
    const legacy = {
      summary: "Análisis de sangre.",
      document_type: "Análisis de sangre",
      study_type: "blood_test",
      key_findings: [
        {
          title: "Glucosa",
          value: "123",
          unit: "mg/dL",
          reference_range: "70-110",
          status: "high",
          explanation: "Por encima del rango.",
        },
      ],
      observations: ["Glucosa elevada."],
      warnings: ["Requiere atención."],
      recommendations: ["Consultar."],
      limitations: ["Sin contexto previo."],
    };
    const result = parseStudyAnalysis(legacy);
    assert.ok(result);
    assert.equal(result.measurements.length, 1);
    assert.equal(result.measurements[0].name, "Glucosa");
    assert.equal(result.measurements[0].value, "123");
    assert.equal(result.measurements[0].status, "above_range");
    // El hallazgo también se extrae
    assert.ok(result.key_findings.length >= 1);
  });

  it("normalización de status legacy correcto", () => {
    const normalResult = normalizeLegacyAnalysis({
      key_findings: [{ title: "A", value: "1", status: "normal", explanation: "B" }],
    });
    assert.ok(normalResult && typeof normalResult === "object");
    const m = (normalResult as Record<string, unknown>).measurements as Array<{ status: string }>;
    assert.equal(m[0].status, "within_range");
  });

  it("normalización de 'high' → 'above_range'", () => {
    const r = normalizeLegacyAnalysis({
      key_findings: [{ title: "A", value: "1", status: "high", explanation: "B" }],
    });
    const m = (r as Record<string, unknown>).measurements as Array<{ status: string }>;
    assert.equal(m[0].status, "above_range");
  });

  it("normalización de 'low' → 'below_range'", () => {
    const r = normalizeLegacyAnalysis({
      key_findings: [{ title: "A", value: "1", status: "low", explanation: "B" }],
    });
    const m = (r as Record<string, unknown>).measurements as Array<{ status: string }>;
    assert.equal(m[0].status, "below_range");
  });

  it("normalización de 'abnormal' → 'abnormal'", () => {
    const r = normalizeLegacyAnalysis({
      key_findings: [{ title: "A", value: "1", status: "abnormal", explanation: "B" }],
    });
    const m = (r as Record<string, unknown>).measurements as Array<{ status: string }>;
    assert.equal(m[0].status, "abnormal");
  });

  it("normalización de 'unknown' → 'unknown'", () => {
    const r = normalizeLegacyAnalysis({
      key_findings: [{ title: "A", value: "1", status: "unknown", explanation: "B" }],
    });
    const m = (r as Record<string, unknown>).measurements as Array<{ status: string }>;
    assert.equal(m[0].status, "unknown");
  });

  it("formato nuevo (con measurements) → normalizeLegacyAnalysis retorna null", () => {
    const result = normalizeLegacyAnalysis(VALID_ANALYSIS);
    assert.equal(result, null);
  });

  it("objeto vacío → normalizeLegacyAnalysis retorna null", () => {
    assert.equal(normalizeLegacyAnalysis({}), null);
  });

  it("null → normalizeLegacyAnalysis retorna null", () => {
    assert.equal(normalizeLegacyAnalysis(null), null);
  });
});

describe("Helper functions", () => {
  it("parseStudyAnalysis", () => {
    const result = parseStudyAnalysis(VALID_ANALYSIS);
    assert.equal(typeof result.summary, "string");
    assert.ok(Array.isArray(result.key_findings));
    assert.ok(Array.isArray(result.measurements));
  });

  it("parseStudyAnalysis — objeto inválido → lanza ZodError", () => {
    assert.throws(
      () => parseStudyAnalysis({}),
      (err: unknown) => err instanceof Error && err.name === "ZodError"
    );
  });

  it("safeParseStudyAnalysis", () => {
    const result = safeParseStudyAnalysis(VALID_ANALYSIS);
    assert.equal(result.success, true);
  });

  it("safeParseStudyAnalysis — objeto inválido → success: false con error", () => {
    const result = safeParseStudyAnalysis({ invalid: true });
    assert.equal(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.length > 0);
    }
  });
});
