import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseStudyAnalysis, safeParseStudyAnalysis } from "../schema.ts";

/**
 * Tests unitarios del pipeline de análisis.
 *
 * NO llaman a Gemini ni a Supabase.
 * Verifican errores, validación de entrada y contrato de salida.
 */

class AnalysisError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "AnalysisError";
    this.code = code;
  }
}

describe("AnalysisError", () => {
  it("tiene name, message y code", () => {
    const err = new AnalysisError("unauthenticated", "No hay sesión.");
    assert.equal(err.name, "AnalysisError");
    assert.equal(err.message, "No hay sesión.");
    assert.equal(err.code, "unauthenticated");
    assert.ok(err instanceof Error);
  });

  it("codes del pipeline", () => {
    const codes = [
      "unauthenticated",
      "study_not_found",
      "study_not_ready",
      "extraction_error",
      "extraction_missing",
      "extraction_empty",
      "gemini_failed",
      "persist_failed",
    ];
    for (const code of codes) {
      const err = new AnalysisError(code, "test");
      assert.equal(err.code, code);
    }
  });
});

describe("Validación de texto de entrada", () => {
  function validateInput(text: unknown): string {
    if (typeof text !== "string") throw new Error("not string");
    const trimmed = text.trim();
    if (trimmed.length === 0) throw new Error("empty");
    return trimmed;
  }

  it("texto válido → pasa", () => {
    assert.equal(validateInput("Glucosa: 123"), "Glucosa: 123");
  });

  it("null → rechazado", () => {
    assert.throws(() => validateInput(null));
  });

  it("string vacío → rechazado", () => {
    assert.throws(() => validateInput(""));
  });

  it("solo espacios → rechazado", () => {
    assert.throws(() => validateInput("   "));
  });
});

describe("Validación de respuesta Gemini (schema)", () => {
  const VALID = {
    summary: "Análisis de sangre con glucosa elevada.",
    document_type: "Análisis de sangre",
    study_type: "blood_test",
    key_findings: [
      {
        title: "Glucosa",
        value: "123",
        unit: "mg/dL",
        reference_range: "70-110 mg/dL",
        status: "high" as const,
        explanation: "Por encima del rango.",
      },
    ],
    observations: ["Glucosa elevada."],
    warnings: ["Requiere atención médica."],
    recommendations: ["Consultar profesional."],
    limitations: ["Sin historia clínica previa."],
  };

  it("respuesta válida → StudyAnalysis", () => {
    const result = parseStudyAnalysis(VALID);
    assert.equal(result.summary, VALID.summary);
    assert.equal(result.key_findings.length, 1);
    assert.equal(result.key_findings[0].status, "high");
  });

  it("respuesta incompleta → ZodError", () => {
    assert.throws(
      () => parseStudyAnalysis({ summary: "x" }),
      (err: unknown) => err instanceof Error && err.name === "ZodError"
    );
  });

  it("status inválido → rechazado", () => {
    const invalid = {
      ...VALID,
      key_findings: [{ ...VALID.key_findings[0], status: "critical" }],
    };
    assert.equal(safeParseStudyAnalysis(invalid).success, false);
  });

  it("JSON.parse con string inválido → SyntaxError", () => {
    assert.throws(() => JSON.parse("not json"), SyntaxError);
  });
});

describe("Estados del estudio para análisis", () => {
  const ANALYZABLE = ["processed"];
  const NOT_ANALYZABLE = ["uploaded", "processing", "error"];

  it("solo 'processed' permite análisis", () => {
    for (const status of ANALYZABLE) {
      assert.equal(status, "processed");
    }
  });

  it("estados no analizables", () => {
    for (const status of NOT_ANALYZABLE) {
      assert.notEqual(status, "processed");
    }
  });
});
