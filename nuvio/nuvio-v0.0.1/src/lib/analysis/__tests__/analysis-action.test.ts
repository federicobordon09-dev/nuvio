import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  ANALYSIS_GENERIC_ERROR,
  ANALYSIS_ERROR_MESSAGES,
  getAnalysisErrorMessage,
} from "../errors.ts";

// ── getAnalysisErrorMessage ─────────────────────────────────────

describe("getAnalysisErrorMessage", () => {
  const cases: [string, string][] = [
    ["unauthenticated", "Iniciá sesión para continuar."],
    [
      "study_not_found",
      "No encontramos el estudio que querés analizar.",
    ],
    [
      "study_not_ready",
      "El estudio todavía no está listo para analizar.",
    ],
    [
      "extraction_error",
      "Ocurrió un error al leer el contenido extraído del estudio.",
    ],
    [
      "extraction_missing",
      "No encontramos el contenido extraído necesario para realizar el análisis.",
    ],
    [
      "extraction_empty",
      "El contenido extraído está vacío. No hay material suficiente para analizar.",
    ],
    [
      "gemini_timeout",
      "La IA tardó demasiado en responder. Intentá de nuevo.",
    ],
    [
      "gemini_network",
      "Ocurrió un problema de conexión con el servicio de IA. Intentá de nuevo.",
    ],
    [
      "gemini_api_error",
      "El servicio de IA no pudo procesar la solicitud. Intentá de nuevo más tarde.",
    ],
    [
      "gemini_invalid_response",
      "El servicio de IA devolvió una respuesta no válida. Intentá de nuevo.",
    ],
    [
      "gemini_failed",
      "Ocurrió un problema al comunicarnos con el servicio de IA.",
    ],
    [
      "persist_failed",
      "El análisis se generó pero no se pudo guardar. Intentá de nuevo.",
    ],
    [
      "analysis_in_progress",
      "El análisis ya está en curso. Esperá unos segundos.",
    ],
  ];

  for (const [code, expected] of cases) {
    it(`devuelve mensaje correcto para "${code}"`, () => {
      assert.equal(getAnalysisErrorMessage(code), expected);
    });
  }

  it("devuelve el mensaje genérico para un código desconocido", () => {
    assert.equal(
      getAnalysisErrorMessage("unknown_error"),
      ANALYSIS_GENERIC_ERROR
    );
  });

  it("devuelve el mensaje genérico para un código vacío", () => {
    assert.equal(getAnalysisErrorMessage(""), ANALYSIS_GENERIC_ERROR);
  });
});

// ── Constantes exportadas ───────────────────────────────────────

describe("Constantes de error", () => {
  it("ANALYSIS_GENERIC_ERROR es un string no vacío", () => {
    assert.ok(ANALYSIS_GENERIC_ERROR.length > 0);
  });

  it("ANALYSIS_ERROR_MESSAGES tiene exactamente 14 entradas", () => {
    assert.equal(Object.keys(ANALYSIS_ERROR_MESSAGES).length, 14);
  });

  it("todas las claves de ANALYSIS_ERROR_MESSAGES son strings no vacíos", () => {
    for (const [code, msg] of Object.entries(ANALYSIS_ERROR_MESSAGES)) {
      assert.ok(code.length > 0, `clave "${code}" no debe ser vacía`);
      assert.ok(msg.length > 0, `mensaje para "${code}" no debe ser vacío`);
    }
  });
});
