import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  analyzeStudyTextWithClient,
  GeminiError,
  classifyGeminiError,
  ANALYSIS_TIMEOUT_MS,
  type GeminiClient,
} from "../gemini.ts";

// ── Stub controlable del cliente Gemini ─────────────────────────
// No se mockea el módulo @google/genai: se inyecta un doble que imita
// `models.generateContent` y cuyo comportamiento se configura por test.
// Esto evita los problemas de ESM de mock.module y mantiene la lógica
// (timeout, clasificación, validación) cubierta con un stub simple.

type MockBehavior = {
  responseText?: string;
  error?: unknown;
};

let currentBehavior: MockBehavior = { responseText: "" };

function makeClient(): GeminiClient {
  return {
    models: {
      async generateContent() {
        if (currentBehavior.error) {
          throw currentBehavior.error;
        }
        return { text: currentBehavior.responseText ?? "" };
      },
    },
  };
}

const MOCK_VALID_RESPONSE = JSON.stringify({
  summary: "Análisis de sangre con glucosa elevada.",
  document_type: "Análisis de sangre",
  study_type: "blood_test",
  key_findings: [
    {
      title: "Glucosa elevada",
      explanation: "La glucosa se encuentra por encima del rango de referencia habitual.",
      importance: "high",
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
  ],
  observations: ["Glucosa elevada."],
  warnings: ["Requiere atención médica."],
  recommendations: ["Consultar profesional."],
  limitations: ["Sin historia clínica previa."],
});

// ── GeminiError ──────────────────────────────────────────────────

describe("GeminiError", () => {
  it("tiene name, message, type y cause", () => {
    const cause = new Error("original");
    const err = new GeminiError("gemini_timeout", "timeout", { cause });
    assert.equal(err.name, "GeminiError");
    assert.equal(err.message, "timeout");
    assert.equal(err.type, "gemini_timeout");
    assert.equal(err.cause, cause);
    assert.ok(err instanceof Error);
  });

  it("acepta los 4 tipos", () => {
    const types = [
      "gemini_timeout",
      "gemini_network",
      "gemini_api_error",
      "gemini_invalid_response",
    ] as const;
    for (const type of types) {
      assert.equal(new GeminiError(type, "test").type, type);
    }
  });
});

// ── classifyGeminiError (lógica pura de clasificación) ──────────

describe("classifyGeminiError", () => {
  it("timeout (AbortError) → gemini_timeout", () => {
    const err = classifyGeminiError(
      new DOMException("aborted", "AbortError")
    );
    assert.equal(err.type, "gemini_timeout");
  });

  it("timeout (mensaje 'excedió el tiempo máximo') → gemini_timeout", () => {
    const err = classifyGeminiError(
      new Error("La llamada a Gemini excedió el tiempo máximo.")
    );
    assert.equal(err.type, "gemini_timeout");
  });

  it("error de red (fetch failed) → gemini_network", () => {
    const err = classifyGeminiError(new TypeError("fetch failed"));
    assert.equal(err.type, "gemini_network");
  });

  it("error de red (ECONNREFUSED) → gemini_network", () => {
    const err = classifyGeminiError(
      new Error("connect ECONNREFUSED 127.0.0.1:443")
    );
    assert.equal(err.type, "gemini_network");
  });

  it("error de API HTTP 429 → gemini_api_error", () => {
    const err = new Error("Rate limited") as Error & { status: number };
    err.status = 429;
    assert.equal(classifyGeminiError(err).type, "gemini_api_error");
  });

  it("error de API HTTP 500 → gemini_api_error", () => {
    const err = new Error("Internal") as Error & { status: number };
    err.status = 500;
    assert.equal(classifyGeminiError(err).type, "gemini_api_error");
  });

  it("error inesperado → gemini_api_error (fallback)", () => {
    const err = classifyGeminiError(new Error("Something weird"));
    assert.equal(err.type, "gemini_api_error");
  });

  it("timeout NO se convierte en network ni api_error", () => {
    const err = classifyGeminiError(
      new DOMException("aborted", "AbortError")
    );
    assert.notEqual(err.type, "gemini_network");
    assert.notEqual(err.type, "gemini_api_error");
    assert.equal(err.type, "gemini_timeout");
  });
});

// ── analyzeStudyTextWithClient (stub controlable) ───────────────

describe("analyzeStudyTextWithClient", () => {
  it("Gemini responde con JSON válido → éxito (StudyAnalysis)", async () => {
    currentBehavior = { responseText: MOCK_VALID_RESPONSE };
    const result = await analyzeStudyTextWithClient(
      "Glucosa: 123 mg/dL",
      makeClient()
    );
    assert.equal(result.summary, "Análisis de sangre con glucosa elevada.");
    assert.equal(result.key_findings.length, 1);
  });

  it("excede el timeout → GeminiError gemini_timeout", async () => {
    currentBehavior = {
      error: new DOMException("aborted", "AbortError"),
    };
    await assert.rejects(
      () =>
        analyzeStudyTextWithClient("Glucosa: 123 mg/dL", makeClient()),
      (err: unknown) => {
        assert.ok(err instanceof GeminiError);
        assert.equal(err.type, "gemini_timeout");
        return true;
      }
    );
  });

  it("error de red → GeminiError gemini_network", async () => {
    currentBehavior = {
      error: new TypeError("fetch failed"),
    };
    await assert.rejects(
      () =>
        analyzeStudyTextWithClient("Glucosa: 123 mg/dL", makeClient()),
      (err: unknown) => {
        assert.ok(err instanceof GeminiError);
        assert.equal(err.type, "gemini_network");
        return true;
      }
    );
  });

  it("error de API HTTP 429 → GeminiError gemini_api_error", async () => {
    const apiErr = new Error("Rate limited") as Error & { status: number };
    apiErr.status = 429;
    currentBehavior = { error: apiErr };
    await assert.rejects(
      () =>
        analyzeStudyTextWithClient("Glucosa: 123 mg/dL", makeClient()),
      (err: unknown) => {
        assert.ok(err instanceof GeminiError);
        assert.equal(err.type, "gemini_api_error");
        return true;
      }
    );
  });

  it("respuesta vacía → GeminiError gemini_invalid_response", async () => {
    currentBehavior = { responseText: "" };
    await assert.rejects(
      () =>
        analyzeStudyTextWithClient("Glucosa: 123 mg/dL", makeClient()),
      (err: unknown) => {
        assert.ok(err instanceof GeminiError);
        assert.equal(err.type, "gemini_invalid_response");
        return true;
      }
    );
  });

  it("JSON inválido → GeminiError gemini_invalid_response", async () => {
    currentBehavior = { responseText: "not json at all" };
    await assert.rejects(
      () =>
        analyzeStudyTextWithClient("Glucosa: 123 mg/dL", makeClient()),
      (err: unknown) => {
        assert.ok(err instanceof GeminiError);
        assert.equal(err.type, "gemini_invalid_response");
        return true;
      }
    );
  });

  it("JSON válido pero schema inválido → gemini_invalid_response", async () => {
    currentBehavior = {
      responseText: JSON.stringify({ summary: "x" }),
    };
    await assert.rejects(
      () =>
        analyzeStudyTextWithClient("Glucosa: 123 mg/dL", makeClient()),
      (err: unknown) => {
        assert.ok(err instanceof GeminiError);
        assert.equal(err.type, "gemini_invalid_response");
        return true;
      }
    );
  });
});

// ── ANALYSIS_TIMEOUT_MS ──────────────────────────────────────────

describe("ANALYSIS_TIMEOUT_MS", () => {
  it("es 45_000 (45 segundos)", () => {
    assert.equal(ANALYSIS_TIMEOUT_MS, 45_000);
  });

  it("es menor que 60 s (límite de Vercel Hobby)", () => {
    assert.ok(
      ANALYSIS_TIMEOUT_MS < 60_000,
      `ANALYSIS_TIMEOUT_MS (${ANALYSIS_TIMEOUT_MS}) debe ser menor que 60_000`
    );
  });
});
