"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  requestStudyAnalysis,
  processStudyAuto,
} from "@/lib/actions/studies";
import { decideAutoPipeline } from "@/lib/analysis/auto-pipeline";
import { getAnalysisErrorMessage } from "@/lib/analysis/errors";

interface StudyPipelineControllerProps {
  studyId: string;
  /** Estado del documento: uploaded, processing, processed, error */
  status: string;
  /** Estado del análisis: pending, processing, completed, failed */
  analysisStatus: string;
  /** Ya existe un análisis válido en study_analyses. */
  hasAnalysis: boolean;
}

/**
 * Controlador cliente del pipeline automático.
 *
 * Orquesta procesamiento + análisis de IA sin intervención del usuario,
 * disparando Server Actions separadas (no bloquea upload ni user requests).
 *
 * Estados mostrados:
 * - "Procesando…" → procesa el documento (MuPDF).
 * - "Analizando con IA…" → ejecuta Gemini (con retry automático para errores transitorios).
 * - Análisis completado → la página lo renderiza vía AnalysisResult.
 * - Error → muestra mensaje + botón de reintento.
 *
 * Reutiliza los Server Actions existentes:
 * - processStudyAuto (nueva action sin redirect)
 * - requestStudyAnalysis (ya existente para "Volver a analizar")
 */
export function StudyPipelineController({
  studyId,
  status,
  analysisStatus,
  hasAnalysis,
}: StudyPipelineControllerProps) {
  const router = useRouter();

  const [phase, setPhase] = useState<
    "idle" | "processing" | "analyzing" | "failed" | "done"
  >(() => {
    const decision = decideAutoPipeline({ status, analysisStatus, hasAnalysis });
    switch (decision.kind) {
      case "done":
        return "done";
      case "failed":
        return "failed";
      case "processing":
        return "processing";
      case "analyzing":
        return "analyzing";
    }
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const started = useRef(false);

  /** Ejecuta el análisis de IA y actualiza el estado según el resultado. */
  const runAnalysis = useCallback(async () => {
    setPhase("analyzing");
    try {
      const result = await requestStudyAnalysis(studyId);
      if (result.success) {
        setPhase("done");
        router.refresh();
      } else {
        setErrorMessage(result.error);
        setPhase("failed");
      }
    } catch {
      setErrorMessage("No pudimos analizar este estudio.");
      setPhase("failed");
    }
  }, [studyId, router]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function run() {
      const decision = decideAutoPipeline({ status, analysisStatus, hasAnalysis });

      // Ya hay análisis → nada que hacer.
      if (decision.kind === "done") {
        setPhase("done");
        return;
      }

      // Análisis fallido anteriormente → mostrar error, no reintentar.
      if (decision.kind === "failed") {
        setPhase("failed");
        return;
      }

      // Análisis en curso (otra pestaña/iniciado antes del reload).
      if (decision.kind === "analyzing" && analysisStatus === "processing") {
        setPhase("analyzing");
        startPolling();
        return;
      }

      // ── Documento no procesado: procesar primero ────────────
      if (decision.kind === "processing") {
        setPhase("processing");
        try {
          const result = await processStudyAuto(studyId);

          if (result.status === "processed") {
            // Procesamiento exitoso → proceder a análisis.
            await runAnalysis();
          } else {
            // Error de procesamiento → la página mostrará el error.
            setPhase("done");
            router.refresh();
          }
        } catch {
          // Error de procesamiento → la página muestra el error + retry manual.
          setPhase("failed");
        }
        return;
      }

      // ── Procesado sin análisis: analizar automáticamente ─────
      await runAnalysis();
    }

    /** Polling para recoger análisis completados en background (otra pestaña). */
    function startPolling() {
      let count = 0;
      const maxPolls = 20; // ~60 s (3 s por poll)
      const interval = setInterval(() => {
        count++;
        if (count >= maxPolls) {
          clearInterval(interval);
          return;
        }
        router.refresh();
      }, 3_000);
    }

    run();
  }, [
    studyId,
    status,
    analysisStatus,
    hasAnalysis,
    router,
    runAnalysis,
  ]);

  // ── Render ────────────────────────────────────────────────────

  if (phase === "done") return null;

  if (phase === "failed") {
    return (
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-danger" />
          <h2 className="text-[15px] font-medium text-foreground">
            Análisis de IA
          </h2>
        </div>
        <p className="text-[14px] leading-[1.6] text-danger-strong">
          {errorMessage ?? getAnalysisErrorMessage("gemini_failed")}
        </p>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              runAnalysis();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-[14px] font-medium text-ocean transition-colors hover:bg-ocean-tint"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <svg
          className="h-5 w-5 animate-spin text-ocean"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <div>
          <h2 className="text-[15px] font-medium text-foreground">
            {phase === "processing"
              ? "Procesando documento…"
              : "Analizando con IA…"}
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {phase === "processing"
              ? "Extrayendo contenido del PDF. Esto tarda unos segundos."
              : "La IA está interpretando el documento. Esto puede tardar unos segundos."}
          </p>
        </div>
      </div>
    </div>
  );
}
