"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  requestStudyAnalysis,
  processStudyAuto,
} from "@/lib/actions/studies";
import { decideAutoPipeline } from "@/lib/analysis/auto-pipeline";

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
 * - "Analizando con IA…" → ejecuta Gemini.
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

  const started = useRef(false);

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
            await startAnalysis();
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
      await startAnalysis();
    }

    async function startAnalysis() {
      setPhase("analyzing");
      try {
        const result = await requestStudyAnalysis(studyId);
        if (result.success) {
          setPhase("done");
          router.refresh();
        } else {
          // La página muestra el mensaje del error (analysis_error) + retry.
          setPhase("failed");
        }
      } catch {
        setPhase("failed");
      }
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
  ]);

  // ── Render ────────────────────────────────────────────────────

  if (phase === "done") return null;
  if (phase === "failed") return null; // La página muestra el error + retry manual.

  return (
    <div className="rounded-xl border border-ink-700/10 bg-white p-6 shadow-[0_1px_2px_rgba(11,20,38,0.04)]">
      <div className="flex items-center gap-3">
        <svg
          className="h-5 w-5 animate-spin text-primary-600"
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
              : "Generando el análisis. Esto puede tardar hasta un minuto."}
          </p>
        </div>
      </div>
    </div>
  );
}
