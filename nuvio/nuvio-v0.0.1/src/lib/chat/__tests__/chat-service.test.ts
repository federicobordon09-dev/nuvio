import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  generateChatReplyWithClient,
  formatContextForPrompt,
  buildUserTurn,
  CHAT_TIMEOUT_MS,
} from "../chat-service.ts";
import { GeminiError } from "../../analysis/gemini.ts";
import type { GeminiClient } from "../../analysis/gemini.ts";
import type { ChatStudyContext } from "../study-context.ts";

// ── Stub controlable del cliente Gemini (misma técnica que F4) ──
type MockBehavior = { responseText?: string; error?: unknown };
let currentBehavior: MockBehavior = { responseText: "" };

function makeClient(): GeminiClient {
  return {
    models: {
      async generateContent() {
        if (currentBehavior.error) throw currentBehavior.error;
        return { text: currentBehavior.responseText ?? "" };
      },
    },
  };
}

const CONTEXT: ChatStudyContext = {
  studyId: "s1",
  fileName: "analisis.pdf",
  studyType: "blood_test",
  analysis: {
    summary: "Glucosa elevada, resto normal.",
    document_type: "Análisis de sangre",
    key_findings: [
      {
        title: "Glucosa",
        value: "123",
        unit: "mg/dL",
        reference_range: "70-110 mg/dL",
        status: "high",
        explanation: "Por encima del rango.",
      },
    ],
    observations: [],
    warnings: [],
    recommendations: [],
    limitations: [],
  },
  extractedText: "Glucosa: 123 mg/dL",
};

const OPTS = {
  userMessage: "¿Qué significa mi glucosa?",
  history: [],
  contexts: [CONTEXT],
};

describe("formatContextForPrompt", () => {
  it("sin contexto → string vacío", () => {
    assert.equal(formatContextForPrompt([]), "");
  });

  it("con contexto → incluye nombre, tipo, resumen, hallazgo y texto", () => {
    const out = formatContextForPrompt([CONTEXT]);
    assert.ok(out.includes("analisis.pdf"));
    assert.ok(out.includes("blood_test"));
    assert.ok(out.includes("Glucosa elevada, resto normal."));
    assert.ok(out.includes("Glucosa: 123 mg/dL"));
    assert.ok(out.includes("Glucosa: 123 mg/dL (rango: 70-110 mg/dL) — Por encima del rango."));
  });

  it("múltiples estudios → separa por bloques", () => {
    const out = formatContextForPrompt([CONTEXT, CONTEXT]);
    assert.equal(out.split("### Estudio").length - 1, 2);
  });
});

describe("buildUserTurn", () => {
  it("con contexto → antepone el bloque de contexto a la pregunta", () => {
    const turn = buildUserTurn("¿Qué significa?", [CONTEXT]);
    assert.ok(turn.startsWith("CONTEXTO DE ESTUDIOS"));
    assert.ok(turn.includes("Pregunta del usuario:\n¿Qué significa?"));
  });

  it("sin contexto → solo la pregunta", () => {
    const turn = buildUserTurn("Hola", []);
    assert.equal(turn, "Pregunta del usuario:\nHola");
  });
});

describe("generateChatReplyWithClient", () => {
  it("respuesta válida → devuelve texto recortado", async () => {
    currentBehavior = { responseText: "  Tu glucosa está elevada.  " };
    const reply = await generateChatReplyWithClient(makeClient(), OPTS);
    assert.equal(reply, "Tu glucosa está elevada.");
  });

  it("respuesta vacía → GeminiError gemini_invalid_response", async () => {
    currentBehavior = { responseText: "" };
    await assert.rejects(
      () => generateChatReplyWithClient(makeClient(), OPTS),
      (err: unknown) => err instanceof GeminiError && err.type === "gemini_invalid_response"
    );
  });

  it("timeout → GeminiError gemini_timeout", async () => {
    currentBehavior = { error: new DOMException("aborted", "AbortError") };
    await assert.rejects(
      () => generateChatReplyWithClient(makeClient(), OPTS),
      (err: unknown) => err instanceof GeminiError && err.type === "gemini_timeout"
    );
  });

  it("error de red → GeminiError gemini_network", async () => {
    currentBehavior = { error: new TypeError("fetch failed") };
    await assert.rejects(
      () => generateChatReplyWithClient(makeClient(), OPTS),
      (err: unknown) => err instanceof GeminiError && err.type === "gemini_network"
    );
  });
});

describe("CHAT_TIMEOUT_MS", () => {
  it("es 45_000 y menor que 60 s (límite Vercel)", () => {
    assert.equal(CHAT_TIMEOUT_MS, 45_000);
    assert.ok(CHAT_TIMEOUT_MS < 60_000);
  });
});
