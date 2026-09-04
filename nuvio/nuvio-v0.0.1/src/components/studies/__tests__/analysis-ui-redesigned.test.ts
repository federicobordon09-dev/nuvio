import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseStoredAnalysis } from "../../../lib/analysis/stored.ts";
import type { StudyAnalysis } from "../../../lib/analysis/schema.ts";

/**
 * Tests de Fase 8.2 — UI rediseñada para resultados de estudio.
 *
 * Verifica que los componentes rendericen correctamente los datos
 * del nuevo schema (key_findings + measurements separados) y que
 * la normalización legacy funcione.
 */

// ── Datos de prueba con nuevo schema ─────────────────────────────

const VALID_ANALYSIS: StudyAnalysis = {
  summary: "Análisis de sangre con glucosa elevada y colesterol en rango.",
  document_type: "Análisis de sangre",
  study_type: "blood_test",
  key_findings: [
    {
      title: "Glucosa elevada",
      explanation: "La glucosa se encuentra por encima del rango de referencia habitual (70-110 mg/dL), lo que puede indicar prediabetes o diabetes.",
      importance: "high",
    },
    {
      title: "Colesterol total normal",
      explanation: "El colesterol total se encuentra dentro de los límites normales.",
      importance: "normal",
    },
  ],
  measurements: [
    {
      name: "Glucosa",
      value: "123",
      unit: "mg/dL",
      reference_range: "70-110",
      status: "above_range",
    },
    {
      name: "Colesterol total",
      value: "190",
      unit: "mg/dL",
      reference_range: "<200",
      status: "within_range",
    },
    {
      name: "Creatinina",
      value: "0.9",
      unit: "mg/dL",
      reference_range: "0.7-1.3",
      status: "within_range",
    },
  ],
  observations: [
    "Glucosa en ayunas elevada, sugiere estudio complementario con HbA1c.",
    "Perfil lipídico dentro de parámetros normales.",
  ],
  warnings: [
    "Glucosa elevada requiere evaluación médica en las próximas semanas.",
    "No suspender medicación sin consultar al médico tratante.",
  ],
  recommendations: [
    "Consultar con médico de cabecera o endocrinólogo.",
    "Realizar HbA1c para confirmar diagnóstico de diabetes.",
    "Controlar dieta y ejercicio.",
  ],
  limitations: [
    "Análisis basado únicamente en el documento proporcionado.",
    "Sin historia clínica previa del paciente.",
    "No se evaluaron otros factores de riesgo cardiovascular.",
  ],
};

// ── Tests de estructura de datos ─────────────────────────────────

describe("Schema analysis para UI rediseñada", () => {
  it("1. Análisis válido (nuevo schema) → estructura completa", () => {
    const result = parseStoredAnalysis(VALID_ANALYSIS);
    assert.ok(result);
    assert.equal(result!.summary, VALID_ANALYSIS.summary);
    assert.equal(result!.document_type, VALID_ANALYSIS.document_type);
    assert.equal(result!.study_type, VALID_ANALYSIS.study_type);
  });

  it("2. key_findings mantiene formato simplificado (title, explanation, importance)", () => {
    const result = parseStoredAnalysis(VALID_ANALYSIS);
    assert.ok(result);
    assert.equal(result!.key_findings.length, 2);
    assert.equal(result!.key_findings[0].title, "Glucosa elevada");
    assert.equal(typeof result!.key_findings[0].explanation, "string");
    assert.ok(result!.key_findings[0].explanation.length > 0);
    assert.ok(["normal", "high", "low", "abnormal", "unknown"].includes(
      result!.key_findings[0].importance ?? "normal"
    ));
    // No debe tener value, unit, reference_range, status (campos legacy)
    assert.ok(!("value" in result!.key_findings[0]));
    assert.ok(!("unit" in result!.key_findings[0]));
  });

  it("3. measurements mantiene formato numérico (name, value, unit, reference_range, status)", () => {
    const result = parseStoredAnalysis(VALID_ANALYSIS);
    assert.ok(result);
    assert.equal(result!.measurements.length, 3);
    assert.equal(result!.measurements[0].name, "Glucosa");
    assert.equal(result!.measurements[0].value, "123");
    assert.equal(result!.measurements[0].unit, "mg/dL");
    assert.equal(result!.measurements[0].reference_range, "70-110");
    assert.ok([
      "within_range",
      "above_range",
      "below_range",
      "abnormal",
      "unknown",
      "no_reference",
    ].includes(result!.measurements[0].status ?? "unknown"));
  });

  it("4. Observaciones, advertencias, recomendaciones, limitaciones como arrays de strings", () => {
    const result = parseStoredAnalysis(VALID_ANALYSIS);
    assert.ok(result);
    assert.ok(Array.isArray(result!.observations));
    assert.ok(Array.isArray(result!.warnings));
    assert.ok(Array.isArray(result!.recommendations));
    assert.ok(Array.isArray(result!.limitations));
    assert.ok(result!.observations.length > 0);
    assert.ok(result!.warnings.length > 0);
    assert.ok(result!.recommendations.length > 0);
    assert.ok(result!.limitations.length > 0);
  });

  it("5. study_type como enum válido (blood_test, MRI, CT, ECG, epicrisis, medical_report, other)", () => {
    const result = parseStoredAnalysis(VALID_ANALYSIS);
    assert.ok(result);
    const validTypes = [
      "blood_test",
      "MRI",
      "CT",
      "ECG",
      "epicrisis",
      "medical_report",
      "other",
    ];
    assert.ok(validTypes.includes(result!.study_type ?? "blood_test"));
  });
});

// ── Normalización legacy (compatibilidad hacia atrás) ─────────────

describe("Normalización legacy para UI rediseñada", () => {
  const LEGACY_ANALYSIS = {
    summary: "Análisis de sangre con valores mixtos.",
    document_type: "Análisis de sangre",
    study_type: "blood_test",
    key_findings: [
      {
        title: "Glucosa",
        value: "123",
        unit: "mg/dL",
        reference_range: "70-110",
        status: "high",
        explanation: "Glucosa por encima del rango.",
      },
      {
        title: "Hemoglobina normal",
        explanation: "Hemoglobina dentro de parámetros normales.",
        // sin value → solo hallazgo clínico
      },
    ],
    observations: ["Valores de referencia estándar."],
    warnings: [],
    recommendations: ["Consultar profesional."],
    limitations: ["Sin datos previos."],
  };

  it("6. Legacy con value/status en key_findings → se separa en measurements + key_findings", () => {
    const result = parseStoredAnalysis(LEGACY_ANALYSIS);
    assert.ok(result);
    // Debe crear una medición para el finding con value
    assert.equal(result!.measurements.length, 1);
    assert.equal(result!.measurements[0].name, "Glucosa");
    assert.equal(result!.measurements[0].value, "123");
    // Status legacy "high" → "above_range"
    assert.equal(result!.measurements[0].status, "above_range");
    // Debe crear un hallazgo clínico para el finding con explanation
    assert.equal(result!.key_findings.length, 2);
    assert.ok(result!.key_findings.some((f) => f.title === "Glucosa"));
    assert.ok(result!.key_findings.some((f) => f.title === "Hemoglobina normal"));
  });

  it("7. Status legacy 'normal' → 'within_range' en measurements", () => {
    const legacy = {
      ...LEGACY_ANALYSIS,
      key_findings: [
        {
          title: "Colesterol",
          value: "180",
          unit: "mg/dL",
          reference_range: "<200",
          status: "normal",
          explanation: "Colesterol normal.",
        },
      ],
    };
    const result = parseStoredAnalysis(legacy);
    assert.ok(result);
    assert.equal(result!.measurements[0].status, "within_range");
  });

  it("8. Status legacy 'low' → 'below_range' en measurements", () => {
    const legacy = {
      ...LEGACY_ANALYSIS,
      key_findings: [
        {
          title: "Hemoglobina",
          value: "11.5",
          unit: "g/dL",
          reference_range: "13-17",
          status: "low",
          explanation: "Hemoglobina baja.",
        },
      ],
    };
    const result = parseStoredAnalysis(legacy);
    assert.ok(result);
    assert.equal(result!.measurements[0].status, "below_range");
  });

  it("9. Status legacy 'abnormal' → 'abnormal' en measurements", () => {
    const legacy = {
      ...LEGACY_ANALYSIS,
      key_findings: [
        {
          title: "Proteína C reactiva",
          value: "15",
          unit: "mg/L",
          reference_range: "<5",
          status: "abnormal",
          explanation: "PCR elevada, proceso inflamatorio.",
        },
      ],
    };
    const result = parseStoredAnalysis(legacy);
    assert.ok(result);
    assert.equal(result!.measurements[0].status, "abnormal");
  });
});

// ── Edge cases y estados vacíos ──────────────────────────────────

describe("Estados vacíos y edge cases en UI", () => {
  it("10. Arrays vacíos → no rompe, devuelve arrays vacíos", () => {
    const empty = {
      ...VALID_ANALYSIS,
      key_findings: [],
      measurements: [],
      observations: [],
      warnings: [],
      recommendations: [],
      limitations: [],
    };
    const result = parseStoredAnalysis(empty);
    assert.ok(result);
    assert.equal(result!.key_findings.length, 0);
    assert.equal(result!.measurements.length, 0);
    assert.equal(result!.observations.length, 0);
    assert.equal(result!.warnings.length, 0);
    assert.equal(result!.recommendations.length, 0);
    assert.equal(result!.limitations.length, 0);
  });

  it("11. unit null → sigue siendo análisis válido", () => {
    const withNullUnit = {
      ...VALID_ANALYSIS,
      measurements: [
        { name: "Glucosa", value: "100", unit: null, reference_range: "70-110" },
      ],
    };
    const result = parseStoredAnalysis(withNullUnit);
    assert.ok(result);
    assert.equal(result!.measurements[0].unit, null);
  });

  it("12. reference_range null → status no_reference", () => {
    const withNullRange = {
      ...VALID_ANALYSIS,
      measurements: [
        { name: "Test nuevo", value: "5", unit: "U/L", reference_range: null, status: "no_reference" },
      ],
    };
    const result = parseStoredAnalysis(withNullRange);
    assert.ok(result);
    assert.equal(result!.measurements[0].reference_range, null);
    assert.equal(result!.measurements[0].status, "no_reference");
  });

  it("13. importance 'unknown' en finding → válido", () => {
    const withUnknown = {
      ...VALID_ANALYSIS,
      key_findings: [
        { title: "Hallazgo dudoso", explanation: "No se puede determinar.", importance: "unknown" },
      ],
    };
    const result = parseStoredAnalysis(withUnknown);
    assert.ok(result);
    assert.equal(result!.key_findings[0].importance, "unknown");
  });

  it("14. Data null/undefined → null (no rompe la página)", () => {
    assert.equal(parseStoredAnalysis(null as unknown as Record<string, unknown>), null);
    assert.equal(parseStoredAnalysis(undefined as unknown as Record<string, unknown>), null);
    assert.equal(parseStoredAnalysis({}), null);
    assert.equal(parseStoredAnalysis({ summary: "incompleto" }), null);
  });

  it("15. Análisis con solo key_findings (sin measurements) → válido", () => {
    const onlyFindings = {
      ...VALID_ANALYSIS,
      measurements: [],
      key_findings: [
        { title: "Hallazgo clínico", explanation: "Solo observación.", importance: "normal" },
      ],
    };
    const result = parseStoredAnalysis(onlyFindings);
    assert.ok(result);
    assert.equal(result!.key_findings.length, 1);
    assert.equal(result!.measurements.length, 0);
  });

  it("16. Análisis con solo measurements (sin key_findings) → válido", () => {
    const onlyMeasurements = {
      ...VALID_ANALYSIS,
      key_findings: [],
      measurements: [
        { name: "Glucosa", value: "100", unit: "mg/dL", reference_range: "70-110", status: "within_range" },
      ],
    };
    const result = parseStoredAnalysis(onlyMeasurements);
    assert.ok(result);
    assert.equal(result!.key_findings.length, 0);
    assert.equal(result!.measurements.length, 1);
  });
});

// ── Validación de statuses del contrato ──────────────────────────

describe("Statuses del contrato para UI", () => {
  it("17. Los 5 importance de key_findings son válidos", () => {
    for (const importance of ["normal", "high", "low", "abnormal", "unknown"] as const) {
      const finding = {
        title: "Hallazgo",
        explanation: "Explicación.",
        importance,
      };
      const result = parseStoredAnalysis({
        ...VALID_ANALYSIS,
        key_findings: [finding],
      });
      assert.ok(result, `importance "${importance}" debería ser válido`);
    }
  });

  it("18. Importance inválido → rechazado", () => {
    const invalid = {
      ...VALID_ANALYSIS,
      key_findings: [
        { ...VALID_ANALYSIS.key_findings[0], importance: "critical" },
      ],
    } as unknown as Record<string, unknown>;
    const result = parseStoredAnalysis(invalid);
    assert.equal(result, null);
  });

  it("19. Los 6 status de measurement son válidos", () => {
    for (const status of ["within_range", "above_range", "below_range", "abnormal", "unknown", "no_reference"] as const) {
      const measurement = {
        name: "Test",
        value: "100",
        unit: "mg/dL",
        reference_range: "70-110",
        status,
      };
      const result = parseStoredAnalysis({
        ...VALID_ANALYSIS,
        measurements: [measurement],
      });
      assert.ok(result, `status "${status}" debería ser válido`);
    }
  });

  it("20. Status de measurement inválido → rechazado", () => {
    const invalid = {
      ...VALID_ANALYSIS,
      measurements: [
        { name: "Glucosa", value: "100", status: "within_range" },
        { name: "Colesterol", value: "200", status: "critical" },
      ],
    } as unknown as Record<string, unknown>;
    const result = parseStoredAnalysis(invalid);
    assert.equal(result, null);
  });

  it("21. study_type null → válido (pre-análisis)", () => {
    const preAnalysis = {
      ...VALID_ANALYSIS,
      study_type: null,
    };
    const result = parseStoredAnalysis(preAnalysis);
    assert.ok(result);
    assert.equal(result!.study_type, null);
  });
});
