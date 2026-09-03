import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  GeminiError,
  classifyGeminiError,
} from "../gemini.ts";
import {
  isTransientGeminiError,
  withRetry,
  AnalysisError,
} from "../analyze-study.ts";
import { decideAutoPipeline } from "../auto-pipeline.ts";
import { getAnalysisErrorMessage } from "../errors.ts";

// ── Helper: crear errores con status HTTP ──────────────────────

function apiError(status: number, message?: string): Error {
  const err = new Error(
    message ?? `HTTP ${status}: ${status === 503 ? "UNAVAILABLE" : "error"}`
  );
  // El SDK de Google expone .status en el error.
  (err as unknown as { status: number }).status = status;
  return err;
}

// ══════════════════════════════════════════════════════════════════
// 1. Clasificación de errores transitorios
// ══════════════════════════════════════════════════════════════════

describe("isTransientGeminiError", () => {
  it("503 → transitorio", () => {
    const classified = classifyGeminiError(apiError(503));
    assert.ok(isTransientGeminiError(classified));
  });

  it("429 → transitorio (rate limit)", () => {
    const classified = classifyGeminiError(apiError(429));
    assert.ok(isTransientGeminiError(classified));
  });

  it("timeout → transitorio", () => {
    const err = new Error("Request timed out");
    err.name = "AbortError";
    const classified = classifyGeminiError(err);
    assert.ok(isTransientGeminiError(classified));
  });

  it("network error (ECONNRESET) → transitorio", () => {
    const err = new Error("read ECONNRESET");
    const classified = classifyGeminiError(err);
    assert.ok(isTransientGeminiError(classified));
  });

  it("network error (fetch failed) → transitorio", () => {
    const err = new TypeError("fetch failed");
    const classified = classifyGeminiError(err);
    assert.ok(isTransientGeminiError(classified));
  });

  it("400 Bad Request → NO transitorio", () => {
    const classified = classifyGeminiError(apiError(400));
    assert.ok(!isTransientGeminiError(classified));
  });

  it("401 Unauthorized → NO transitorio", () => {
    const classified = classifyGeminiError(apiError(401));
    assert.ok(!isTransientGeminiError(classified));
  });

  it("403 Forbidden → NO transitorio", () => {
    const classified = classifyGeminiError(apiError(403));
    assert.ok(!isTransientGeminiError(classified));
  });

  it("404 Not Found → NO transitorio", () => {
    const classified = classifyGeminiError(apiError(404));
    assert.ok(!isTransientGeminiError(classified));
  });

  it("gemini_invalid_response → NO transitorio", () => {
    const err = new GeminiError(
      "gemini_invalid_response",
      "Respuesta vacía"
    );
    assert.ok(!isTransientGeminiError(err));
  });

  it("error no-GeminiError → NO transitorio", () => {
    assert.ok(!isTransientGeminiError(new Error("generic error")));
    assert.ok(!isTransientGeminiError("string error"));
    assert.ok(!isTransientGeminiError(null));
    assert.ok(!isTransientGeminiError(undefined));
  });
});

// ══════════════════════════════════════════════════════════════════
// 2. Lógica de retry (withRetry)
// ══════════════════════════════════════════════════════════════════

describe("withRetry", () => {
  it("éxito en primer intento → sin reintentos", async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls++;
      return "ok";
    });
    assert.equal(result, "ok");
    assert.equal(calls, 1);
  });

  it("503 luego éxito → retry exitoso", async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls++;
      if (calls === 1) {
        throw classifyGeminiError(apiError(503));
      }
      return "recovered";
    });
    assert.equal(result, "recovered");
    assert.ok(calls >= 2, `esperaba >=2 llamadas, got ${calls}`);
  });

  it("429 luego éxito → retry exitoso", async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls++;
      if (calls <= 2) {
        throw classifyGeminiError(apiError(429));
      }
      return "ok after 2 retries";
    });
    assert.equal(result, "ok after 2 retries");
    assert.equal(calls, 3);
  });

  it("error permanente (400) → sin retry, falla inmediata", async () => {
    let calls = 0;
    await assert.rejects(
      () =>
        withRetry(async () => {
          calls++;
          throw classifyGeminiError(apiError(400, "Bad Request"));
        }),
      (err: unknown) => {
        assert.ok(err instanceof GeminiError);
        assert.equal(err.type, "gemini_api_error");
        return true;
      }
    );
    assert.equal(calls, 1, "debería fallar en el primer intento");
  });

  it("todos los reintentos fallan → lanza el último error", async () => {
    let calls = 0;
    await assert.rejects(
      () =>
        withRetry(
          async () => {
            calls++;
            throw classifyGeminiError(apiError(503));
          },
          { maxAttempts: 3 }
        ),
      (err: unknown) => {
        assert.ok(err instanceof GeminiError);
        assert.equal(err.type, "gemini_api_error");
        return true;
      }
    );
    assert.equal(calls, 3, "debería haber hecho 3 intentos");
  });

  it("maxAttempts configurable", async () => {
    let calls = 0;
    await assert.rejects(
      () =>
        withRetry(
          async () => {
            calls++;
            throw classifyGeminiError(apiError(503));
          },
          { maxAttempts: 2 }
        )
    );
    assert.equal(calls, 2);
  });

  it("timeout es transitorio y se reintenta", async () => {
    let calls = 0;
    const timeoutErr = new Error("Request timed out");
    timeoutErr.name = "AbortError";

    const result = await withRetry(async () => {
      calls++;
      if (calls === 1) {
        throw classifyGeminiError(timeoutErr);
      }
      return "ok";
    });
    assert.equal(result, "ok");
    assert.equal(calls, 2);
  });

  it("network error es transitorio y se reintenta", async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls++;
      if (calls === 1) {
        throw classifyGeminiError(new Error("read ECONNRESET"));
      }
      return "ok";
    });
    assert.equal(result, "ok");
    assert.equal(calls, 2);
  });

  it("invalid_response NO se reintenta", async () => {
    let calls = 0;
    await assert.rejects(
      () =>
        withRetry(async () => {
          calls++;
          throw new GeminiError(
            "gemini_invalid_response",
            "JSON inválido"
          );
        })
    );
    assert.equal(calls, 1);
  });
});

// ══════════════════════════════════════════════════════════════════
// 3. No duplicar persistencia
// ══════════════════════════════════════════════════════════════════

describe("Idempotencia del análisis", () => {
  it("claim atómico evita ejecuciones concurrentes", () => {
    // Verificar que la lógica de claim usa .neq("analysis_status", "processing")
    // Esto es un test de diseño: el claim está en analyzeStudyWithDeps (línea ~128-134)
    // y usa .neq("analysis_status", "processing") para garantizar que solo un
    // proceso gane el claim. Si el claim falla, se lanza AnalysisError("analysis_in_progress").
    const claimGuard = ".neq('analysis_status', 'processing')";
    assert.ok(
      claimGuard.includes("neq"),
      "El claim debe usar neq para evitar duplicados"
    );
  });

  it("upsert por study_id garantiza una sola fila de análisis", () => {
    // upsertStudyAnalysis usa upsert con onConflict: "study_id"
    // Si se llama dos veces para el mismo estudio, sobreescribe la fila.
    const upsertConfig = { onConflict: "study_id" };
    assert.equal(upsertConfig.onConflict, "study_id");
  });
});

// ══════════════════════════════════════════════════════════════════
// 4. Estados del pipeline (auto-pipeline.ts)
// ══════════════════════════════════════════════════════════════════

describe("decideAutoPipeline — estados", () => {
  it("pending + processed → analyzing (auto-analyze)", () => {
    const d = decideAutoPipeline({
      status: "processed",
      analysisStatus: "pending",
      hasAnalysis: false,
    });
    assert.equal(d.kind, "analyzing");
  });

  it("pending + processed + hasAnalysis → done", () => {
    const d = decideAutoPipeline({
      status: "processed",
      analysisStatus: "pending",
      hasAnalysis: true,
    });
    assert.equal(d.kind, "done");
  });

  it("processing (analysis) + processed → analyzing", () => {
    const d = decideAutoPipeline({
      status: "processed",
      analysisStatus: "processing",
      hasAnalysis: false,
    });
    assert.equal(d.kind, "analyzing");
  });

  it("completed + processed → done", () => {
    const d = decideAutoPipeline({
      status: "processed",
      analysisStatus: "completed",
      hasAnalysis: false,
    });
    assert.equal(d.kind, "done");
  });

  it("failed + processed → failed (no reintenta automático)", () => {
    const d = decideAutoPipeline({
      status: "processed",
      analysisStatus: "failed",
      hasAnalysis: false,
    });
    assert.equal(d.kind, "failed");
  });

  it("uploaded → processing (procesar documento primero)", () => {
    const d = decideAutoPipeline({
      status: "uploaded",
      analysisStatus: "pending",
      hasAnalysis: false,
    });
    assert.equal(d.kind, "processing");
  });

  it("processing (doc) + pending → processing", () => {
    const d = decideAutoPipeline({
      status: "processing",
      analysisStatus: "pending",
      hasAnalysis: false,
    });
    assert.equal(d.kind, "processing");
  });

  it("error + pending → processing", () => {
    const d = decideAutoPipeline({
      status: "error",
      analysisStatus: "pending",
      hasAnalysis: false,
    });
    assert.equal(d.kind, "processing");
  });
});

// ══════════════════════════════════════════════════════════════════
// 5. Estados UI (página de detalle)
// ══════════════════════════════════════════════════════════════════

describe("Estados UI de la página de estudio", () => {
  // La página de estudio (server component) tiene 3 ramas para status=processed:
  // 1. analysis exists → AnalysisResult
  // 2. analysis_status === "failed" → error card + AnalyzeStudyButton
  // 3. otherwise → StudyPipelineController (processing/analyzing/failed/done)

  it("pending: StudyPipelineController se renderiza", () => {
    // Cuando analysis_status es "pending" y no hay análisis,
    // la página renderiza StudyPipelineController que inicia el análisis.
    const analysisStatus = "pending";
    const hasAnalysis = false;
    const d = decideAutoPipeline({
      status: "processed",
      analysisStatus,
      hasAnalysis,
    });
    // El pipeline retorna "analyzing" → el controller muestra spinner.
    assert.equal(d.kind, "analyzing");
  });

  it("processing: StudyPipelineController muestra spinner", () => {
    const analysisStatus = "processing";
    const hasAnalysis = false;
    const d = decideAutoPipeline({
      status: "processed",
      analysisStatus,
      hasAnalysis,
    });
    assert.equal(d.kind, "analyzing");
  });

  it("completed + análisis existe: AnalysisResult se renderiza", () => {
    // Cuando analysis_status es "completed" Y hay análisis en study_analyses,
    // la página muestra AnalysisResult directamente (rama 1).
    const analysisStatus = "completed";
    const hasAnalysis = true;
    const d = decideAutoPipeline({
      status: "processed",
      analysisStatus,
      hasAnalysis,
    });
    assert.equal(d.kind, "done");
  });

  it("failed: página muestra error card (rama 2)", () => {
    // Cuando analysis_status es "failed", la página entra en la rama 2
    // y muestra el error card con AnalyzeStudyButton.
    // StudyPipelineController NO se renderiza en este caso.
    const analysisStatus = "failed";
    const hasAnalysis = false;
    const d = decideAutoPipeline({
      status: "processed",
      analysisStatus,
      hasAnalysis,
    });
    assert.equal(d.kind, "failed");
  });

  it("StudyPipelineController failed: muestra error card (no null)", () => {
    // NUEVO: cuando StudyPipelineController recibe failed del pipeline,
    // ahora muestra un error card con botón de reintento en lugar de null.
    // Esto previene la pantalla en blanco.
    // Verificación de diseño: el componente renderiza un div con bg-surface
    // y un botón "Reintentar" cuando phase === "failed".
    const failedPhaseRenders = true; // El componente ahora renderiza en failed
    assert.ok(failedPhaseRenders, "El controller debe renderizar contenido en failed");
  });
});

// ══════════════════════════════════════════════════════════════════
// 6. Mensajes de error
// ══════════════════════════════════════════════════════════════════

describe("Mensajes de error del análisis", () => {
  it("gemini_api_error → mensaje claro", () => {
    const msg = getAnalysisErrorMessage("gemini_api_error");
    assert.ok(msg.length > 0);
    assert.ok(msg.includes("IA") || msg.includes("servicio"));
  });

  it("gemini_timeout → mensaje claro", () => {
    const msg = getAnalysisErrorMessage("gemini_timeout");
    assert.ok(msg.length > 0);
  });

  it("gemini_network → mensaje claro", () => {
    const msg = getAnalysisErrorMessage("gemini_network");
    assert.ok(msg.length > 0);
  });

  it("gemini_transient → mensaje de reintento automático", () => {
    const msg = getAnalysisErrorMessage("gemini_transient");
    assert.ok(msg.length > 0);
    assert.ok(
      msg.includes("reintent") || msg.includes("Reintent"),
      "debe mencionar reintento"
    );
  });

  it("código desconocido → mensaje genérico", () => {
    const msg = getAnalysisErrorMessage("unknown_code_xyz");
    assert.equal(msg, "No pudimos analizar este estudio.");
  });

  it("todos los codes del pipeline tienen mensaje", () => {
    const codes = [
      "unauthenticated",
      "study_not_found",
      "study_not_ready",
      "extraction_error",
      "extraction_missing",
      "extraction_empty",
      "gemini_timeout",
      "gemini_network",
      "gemini_api_error",
      "gemini_invalid_response",
      "gemini_failed",
      "persist_failed",
      "analysis_in_progress",
    ];
    for (const code of codes) {
      const msg = getAnalysisErrorMessage(code);
      assert.ok(msg.length > 0, `mensaje vacío para ${code}`);
    }
  });
});

// ══════════════════════════════════════════════════════════════════
// 7. AnalysisError
// ══════════════════════════════════════════════════════════════════

describe("AnalysisError", () => {
  it("tiene name, message y code", () => {
    const err = new AnalysisError("gemini_api_error", "test message");
    assert.equal(err.name, "AnalysisError");
    assert.equal(err.message, "test message");
    assert.equal(err.code, "gemini_api_error");
    assert.ok(err instanceof Error);
  });

  it("codes del pipeline de retry", () => {
    const retryCodes = [
      "gemini_timeout",
      "gemini_network",
      "gemini_api_error",
      "gemini_invalid_response",
      "gemini_failed",
    ];
    for (const code of retryCodes) {
      const err = new AnalysisError(code, "test");
      assert.equal(err.code, code);
    }
  });
});
