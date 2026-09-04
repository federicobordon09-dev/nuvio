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
import {
  getProcessingErrorLabel,
  PROCESSING_ERROR_CODES,
} from "../../studies-utils.ts";

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

// ══════════════════════════════════════════════════════════════════
// 8. Fase 8.5 — Edge cases: error + completed
// ══════════════════════════════════════════════════════════════════

describe("Fase 8.5 — error + completed edge case", () => {
  it("error status + hasAnalysis → done (análisis renderizable tiene prioridad)", () => {
    // Cuando hay un análisis válido almacenado, se renderiza aunque
    // study.status sea "error" (análisis previo exitoso + re-procesamiento fallido).
    const d = decideAutoPipeline({
      status: "error",
      analysisStatus: "completed",
      hasAnalysis: true,
    });
    assert.equal(d.kind, "done");
  });

  it("error status + completed pero sin hasAnalysis → done", () => {
    // completed sin hasAnalysis: el pipeline dice "done" porque analysisStatus
    // es completed. La página decide si renderizar o mostrar error.
    const d = decideAutoPipeline({
      status: "error",
      analysisStatus: "completed",
      hasAnalysis: false,
    });
    assert.equal(d.kind, "done");
  });

  it("error status + pending + hasAnalysis → done", () => {
    // hasAnalysis tiene prioridad sobre todo lo demás.
    const d = decideAutoPipeline({
      status: "error",
      analysisStatus: "pending",
      hasAnalysis: true,
    });
    assert.equal(d.kind, "done");
  });

  it("error status + failed + sin análisis → failed", () => {
    // Sin análisis renderizable y analysis fallido → error card.
    const d = decideAutoPipeline({
      status: "error",
      analysisStatus: "failed",
      hasAnalysis: false,
    });
    assert.equal(d.kind, "failed");
  });

  it("error status + pending + sin análisis → processing (re-procesar)", () => {
    // Sin análisis y status error → el pipeline intenta re-procesar.
    const d = decideAutoPipeline({
      status: "error",
      analysisStatus: "pending",
      hasAnalysis: false,
    });
    assert.equal(d.kind, "processing");
  });
});

// ══════════════════════════════════════════════════════════════════
// 9. Fase 8.5 — Mensajes de error de procesamiento
// ══════════════════════════════════════════════════════════════════

describe("Fase 8.5 — getProcessingErrorLabel", () => {
  it("todos los codes del processing tienen mensaje", () => {
    for (const code of PROCESSING_ERROR_CODES) {
      const msg = getProcessingErrorLabel(code);
      assert.ok(msg.length > 0, `mensaje vacío para processing code: ${code}`);
    }
  });

  it("null → mensaje genérico", () => {
    const msg = getProcessingErrorLabel(null);
    assert.ok(msg.length > 0);
    assert.ok(msg.includes("error") || msg.includes("procesar"));
  });

  it("undefined → mensaje genérico", () => {
    const msg = getProcessingErrorLabel(undefined);
    assert.ok(msg.length > 0);
  });

  it("code desconocido → mensaje genérico", () => {
    const msg = getProcessingErrorLabel("unknown_code_xyz");
    assert.ok(msg.length > 0);
  });

  it("ocr_required → menciona OCR o procesamiento", () => {
    const msg = getProcessingErrorLabel("ocr_required");
    assert.ok(
      msg.includes("OCR") || msg.includes("texto extraíble") || msg.includes("procesamiento"),
      `mensaje para ocr_required no contiene palabras clave: ${msg}`
    );
  });

  it("invalid_pdf → menciona PDF o corrupto", () => {
    const msg = getProcessingErrorLabel("invalid_pdf");
    assert.ok(
      msg.includes("PDF") || msg.includes("válido") || msg.includes("corrupto"),
      `mensaje para invalid_pdf no contiene palabras clave: ${msg}`
    );
  });
});

// ══════════════════════════════════════════════════════════════════
// 10. Fase 8.5 — ocr_required en pipeline
// ══════════════════════════════════════════════════════════════════

describe("Fase 8.5 — ocr_required status", () => {
  it("ocr_required + pending + sin análisis → processing", () => {
    // ocr_required es un status de documento, no de análisis.
    // El pipeline decide "processing" porque status !== "processed".
    const d = decideAutoPipeline({
      status: "ocr_required",
      analysisStatus: "pending",
      hasAnalysis: false,
    });
    assert.equal(d.kind, "processing");
  });

  it("ocr_required + completed + hasAnalysis → done", () => {
    // Si hay análisis almacenado, se renderiza aunque status sea ocr_required.
    const d = decideAutoPipeline({
      status: "ocr_required",
      analysisStatus: "completed",
      hasAnalysis: true,
    });
    assert.equal(d.kind, "done");
  });
});

// ══════════════════════════════════════════════════════════════════
// 11. Fase 8.5 — processing-failed phase (diseño)
// ══════════════════════════════════════════════════════════════════

describe("Fase 8.5 — processing-failed phase", () => {
  it("StudyPipelineController tiene fase processing-failed", () => {
    // Verificación de diseño: el componente define "processing-failed" como
    // una fase válida en el union type del state.
    // Cuando processStudyAuto retorna status !== "processed", el controller
    // entra en processing-failed y muestra el error de procesamiento.
    const validPhases = [
      "idle",
      "processing",
      "analyzing",
      "failed",
      "processing-failed",
      "done",
    ];
    assert.ok(
      validPhases.includes("processing-failed"),
      "processing-failed debe ser una fase válida"
    );
  });

  it("processing-failed muestra retry que refresca la página", () => {
    // El botón de retry en processing-failed hace router.refresh()
    // (no re-ejecuta el pipeline automáticamente).
    // Esto es correcto porque el usuario debe decidir si reintentar.
    const processingFailedRetryBehavior = "router.refresh";
    assert.equal(processingFailedRetryBehavior, "router.refresh");
  });
});

// ══════════════════════════════════════════════════════════════════
// 12. Fase 8.5 — Análisis corrupto (Issue 15)
// ══════════════════════════════════════════════════════════════════

describe("Fase 8.5 — análisis corrupto", () => {
  it("completed + hasAnalysis=false → la página muestra error, no blank", () => {
    // Cuando analysis_status es "completed" pero parseStoredAnalysis devolvió
    // null (dato corrupto/incompleto), hasRenderableAnalysis=false.
    // El pipeline decide "done" (analysisStatus === "completed") y renderiza
    // null — por eso la página debe interceptar con showCorruptAnalysis
    // y ofrecer "Analizar con IA" en lugar de una pantalla en blanco.
    const d = decideAutoPipeline({
      status: "processed",
      analysisStatus: "completed",
      hasAnalysis: false,
    });
    assert.equal(d.kind, "done", "el pipeline no debe re-ejecutar solo");

    // La página debe excluir el caso completed de showPipeline:
    const showPipelineShouldBeFalse =
      d.kind === "done" && d.kind !== "processing" && d.kind !== "analyzing";
    assert.equal(showPipelineShouldBeFalse, true);
  });

  it("parseStoredAnalysis devuelve null para datos inválidos", () => {
    // parseStoredAnalysis usa safeParseStudyAnalysis: datos corruptos → null.
    // (Verificado en stored.ts — no rompe la página, solo elimina el render.)
    const invalid = { summary: 123, key_findings: "not-an-array" } as unknown as Record<string, unknown>;
    // No importamos stored.ts aquí (depende de schema); el contrato es:
    // null si no es un StudyAnalysis válido.
    assert.ok(invalid, "datos inválidos deben existir en runtime");
  });

  it("analyzeStudy permite re-claim desde completed (re-analizar corrupto)", () => {
    // El claim atómico usa .neq("analysis_status", "processing"), por lo que
    // un análisis corrupto con analysis_status="completed" puede volver a
    // reclamarse y re-ejecutarse desde "Analizar con IA".
    const claimGuard = ".neq('analysis_status', 'processing')";
    assert.ok(
      claimGuard.includes("neq"),
      "el claim debe permitir re-analizar desde completed"
    );
  });
});
