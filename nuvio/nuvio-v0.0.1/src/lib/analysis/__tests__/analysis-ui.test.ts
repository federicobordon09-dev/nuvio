import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseStoredAnalysis } from "../stored.ts";
import { safeParseStudyAnalysis } from "../schema.ts";

/**
 * Tests de Fase 8.1 — lógica pura server-side para mostrar el análisis
 * almacenado en study_analyses sin romper la página.
 *
 * La arquitectura no tiene renderer de componentes (node:test sin jsdom),
 * por lo que se priorizan las funciones puras y la validación del flujo.
 *
 * Cubre tanto el nuevo formato (con measurements) como la normalización
 * de análisis legacy (Fase 4.x) persistidos en Supabase.
 */

const VALID_ANALYSIS = {
  summary: "Análisis de sangre con valores dentro de parámetros normales.",
  document_type: "Análisis de sangre",
  study_type: "blood_test",
  key_findings: [
    {
      title: "Glucosa en rango",
      explanation: "Glucosa dentro del rango normal.",
      importance: "normal",
    },
  ],
  measurements: [
    {
      name: "Glucosa",
      value: "94",
      unit: "mg/dL",
      reference_range: "70-110",
      status: "within_range",
    },
  ],
  observations: ["Valores dentro de parámetros normales."],
  warnings: [],
  recommendations: ["Mantener hábitos saludables."],
  limitations: ["Sin historia clínica previa."],
};

describe("parseStoredAnalysis (validación del análisis almacenado)", () => {
  it("análisis válido → devuelve StudyAnalysis listo para renderizar", () => {
    const result = parseStoredAnalysis(VALID_ANALYSIS);
    assert.ok(result);
    assert.equal(result!.summary, VALID_ANALYSIS.summary);
    assert.equal(result!.document_type, VALID_ANALYSIS.document_type);
  });

  it("summary se conserva", () => {
    const result = parseStoredAnalysis(VALID_ANALYSIS);
    assert.equal(result!.summary, VALID_ANALYSIS.summary);
  });

  it("key_findings y measurements se conservan con sus datos", () => {
    const result = parseStoredAnalysis(VALID_ANALYSIS);
    assert.ok(result);
    assert.equal(result!.key_findings.length, 1);
    assert.equal(result!.key_findings[0].title, "Glucosa en rango");
    assert.equal(result!.measurements.length, 1);
    assert.equal(result!.measurements[0].name, "Glucosa");
    assert.equal(result!.measurements[0].value, "94");
    assert.equal(result!.measurements[0].unit, "mg/dL");
    assert.equal(result!.measurements[0].reference_range, "70-110");
    assert.equal(result!.measurements[0].status, "within_range");
  });

  it("análisis legacy (key_findings con value/status) → se normaliza a measurements", () => {
    const legacy = {
      summary: "Análisis de sangre con valores dentro de parámetros normales.",
      document_type: "Análisis de sangre",
      study_type: "blood_test",
      key_findings: [
        {
          title: "Glucosa",
          value: "94",
          unit: "mg/dL",
          reference_range: "70-110",
          status: "normal",
          explanation: "Glucosa dentro del rango normal.",
        },
      ],
      observations: ["Valores dentro de parámetros normales."],
      warnings: [],
      recommendations: ["Mantener hábitos saludables."],
      limitations: ["Sin historia clínica previa."],
    };
    const result = parseStoredAnalysis(legacy);
    assert.ok(result);
    assert.equal(result!.measurements.length, 1);
    assert.equal(result!.measurements[0].name, "Glucosa");
    assert.equal(result!.measurements[0].value, "94");
    // El status legacy "normal" se mapea a "within_range"
    assert.equal(result!.measurements[0].status, "within_range");
    // También genera un hallazgo clínico
    assert.ok(result!.key_findings.length >= 1);
  });

  it("unit null no rompe → sigue siendo un análisis válido", () => {
    const withNullUnit = {
      ...VALID_ANALYSIS,
      measurements: [
        {
          name: "Glucosa",
          value: "94",
          unit: null,
          reference_range: null,
        },
      ],
    };
    const result = parseStoredAnalysis(withNullUnit);
    assert.ok(result);
    assert.equal(result!.measurements[0].unit, null);
    assert.equal(result!.measurements[0].reference_range, null);
  });

  it("reference_range null no rompe → sigue siendo un análisis válido", () => {
    const withNullRange = {
      ...VALID_ANALYSIS,
      measurements: [
        {
          name: "Glucosa",
          value: "94",
          unit: "mg/dL",
          reference_range: null,
          status: "no_reference",
        },
      ],
    };
    const result = parseStoredAnalysis(withNullRange);
    assert.ok(result);
    assert.equal(result!.measurements[0].reference_range, null);
  });

  it("arrays vacíos son válidos (no generan secciones vacías)", () => {
    const withEmptyArrays = {
      ...VALID_ANALYSIS,
      key_findings: [],
      measurements: [],
      observations: [],
      warnings: [],
      recommendations: [],
      limitations: [],
    };
    const result = parseStoredAnalysis(withEmptyArrays);
    assert.ok(result);
    assert.equal(result!.key_findings.length, 0);
    assert.equal(result!.measurements.length, 0);
    assert.equal(result!.warnings.length, 0);
    assert.equal(result!.limitations.length, 0);
  });

  it("data vacía/ausente → null (estado vacío sin romper)", () => {
    assert.equal(parseStoredAnalysis({}), null);
  });

  it("datos inválidos → null (no lanza, no rompe la página)", () => {
    assert.equal(parseStoredAnalysis({ summary: "incompleto" }), null);
    assert.equal(parseStoredAnalysis({ invalid: true }), null);
  });

  it("null como dato → null (no lanza)", () => {
    assert.equal(parseStoredAnalysis(null as unknown as Record<string, unknown>), null);
  });
});

describe("Statuses conocidos del contrato", () => {
  it("los 5 importance de key_findings pasan la validación del schema", () => {
    for (const status of ["normal", "high", "low", "abnormal", "unknown"]) {
      const finding = {
        title: "Hallazgo",
        explanation: "Explicación.",
        importance: status,
      };
      const result = safeParseStudyAnalysis({
        ...VALID_ANALYSIS,
        key_findings: [finding],
      });
      assert.equal(
        result.success,
        true,
        `importance "${status}" debería ser válido`
      );
    }
  });

  it("un importance fuera del enum → rechazado", () => {
    const result = safeParseStudyAnalysis({
      ...VALID_ANALYSIS,
      key_findings: [{ ...VALID_ANALYSIS.key_findings[0], importance: "critical" }],
    });
    assert.equal(result.success, false);
  });

  it("status de measurement inválido → rechazado", () => {
    const result = safeParseStudyAnalysis({
      ...VALID_ANALYSIS,
      measurements: [
        { name: "Glucosa", value: "94", status: "within_range" },
        { name: "Colesterol", value: "200", status: "critical" },
      ],
    });
    assert.equal(result.success, false);
  });
});
