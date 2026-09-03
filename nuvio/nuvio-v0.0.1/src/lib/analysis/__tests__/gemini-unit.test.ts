import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseStudyAnalysis, safeParseStudyAnalysis } from "../schema.ts";

/**
 * Tests unitarios de la capa de análisis.
 *
 * Estos tests NO llaman a Gemini. Verifican la lógica de validación
 * de entrada y la validación post-Gemini usando el schema existente.
 */

const MOCK_GEMINI_RESPONSE = {
  summary:
    "Análisis de sangre con glucosa elevada y hemoglobina dentro de parámetros normales.",
  document_type: "Análisis de sangre",
  study_type: "blood_test",
  key_findings: [
    {
      title: "Glucosa",
      value: "123",
      unit: "mg/dL",
      reference_range: "70-110 mg/dL",
      status: "high",
      explanation:
        "Glucosa por encima del rango de referencia. Puede indicar hiperglucemia.",
    },
    {
      title: "Hemoglobina",
      value: "14.2",
      unit: "g/dL",
      reference_range: "13.0-17.0 g/dL",
      status: "normal",
      explanation: "Hemoglobina dentro del rango normal.",
    },
  ],
  observations: [
    "La glucosa se encuentra por encima del rango de referencia habitual.",
  ],
  warnings: [
    "Un nivel de glucosa de 123 mg/dL en ayunas puede requerir evaluación médica.",
  ],
  recommendations: [
    "Consultar con un profesional de la salud para interpretación clínica.",
  ],
  limitations: [
    "No se dispone de contexto clínico previo del paciente.",
    "No se indica si la muestra fue tomada en ayunas.",
  ],
};

describe("Validación de entrada (sin llamar a Gemini)", () => {
  function validateInput(text: unknown): string {
    if (typeof text !== "string") {
      throw new Error("El texto de entrada debe ser un string.");
    }
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      throw new Error("El texto de entrada está vacío.");
    }
    return trimmed;
  }

  it("texto válido → pasa validación", () => {
    const result = validateInput("Glucosa: 123 mg/dL");
    assert.equal(result, "Glucosa: 123 mg/dL");
  });

  it("texto con espacios alrededor → trimea", () => {
    const result = validateInput("  Glucosa: 123 mg/dL  ");
    assert.equal(result, "Glucosa: 123 mg/dL");
  });

  it("null → rechazado", () => {
    assert.throws(
      () => validateInput(null),
      (err: unknown) =>
        err instanceof Error && err.message.includes("string")
    );
  });

  it("undefined → rechazado", () => {
    assert.throws(
      () => validateInput(undefined),
      (err: unknown) =>
        err instanceof Error && err.message.includes("string")
    );
  });

  it("number → rechazado", () => {
    assert.throws(
      () => validateInput(123),
      (err: unknown) =>
        err instanceof Error && err.message.includes("string")
    );
  });

  it("string vacío → rechazado", () => {
    assert.throws(
      () => validateInput(""),
      (err: unknown) =>
        err instanceof Error && err.message.includes("vacío")
    );
  });

  it("string solo espacios → rechazado", () => {
    assert.throws(
      () => validateInput("   "),
      (err: unknown) =>
        err instanceof Error && err.message.includes("vacío")
    );
  });
});

describe("Parsing de respuesta simulada de Gemini", () => {
  it("respuesta JSON válida → parseStudyAnalysis la acepta", () => {
    const analysis = parseStudyAnalysis(MOCK_GEMINI_RESPONSE);
    assert.equal(analysis.summary, MOCK_GEMINI_RESPONSE.summary);
    assert.equal(analysis.key_findings.length, 2);
    assert.equal(analysis.key_findings[0].status, "high");
    assert.equal(analysis.key_findings[1].status, "normal");
  });

  it("respuesta JSON inválida → error controlado", () => {
    assert.throws(
      () => parseStudyAnalysis({ invalid: true }),
      (err: unknown) => err instanceof Error && err.name === "ZodError"
    );
  });

  it("respuesta que no cumple schema → error controlado", () => {
    const incomplete = {
      summary: "Test",
      document_type: "Test",
      key_findings: "not an array",
      observations: [],
      warnings: [],
      recommendations: [],
      limitations: [],
    };
    const result = safeParseStudyAnalysis(incomplete);
    assert.equal(result.success, false);
  });

  it("respuesta vacía → error controlado", () => {
    const result = safeParseStudyAnalysis({});
    assert.equal(result.success, false);
  });

  it("null → error controlado", () => {
    const result = safeParseStudyAnalysis(null);
    assert.equal(result.success, false);
  });

  it("JSON.parse con string inválido → error controlado", () => {
    assert.throws(
      () => JSON.parse("not json"),
      (err: unknown) => err instanceof SyntaxError
    );
  });
});
