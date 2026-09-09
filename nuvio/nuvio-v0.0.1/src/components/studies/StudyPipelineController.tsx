"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  requestStudyAnalysis,
  processStudyAuto,
} from "@/lib/actions/studies";
import { decideAutoPipeline } from "@/lib/analysis/auto-pipeline";
import { getAnalysisErrorMessage } from "@/lib/analysis/errors";
import { getProcessingErrorLabel } from "@/lib/studies-utils";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorTriangle } from "@/components/ui/icons";
import { Button } from "@/components/ui/Button";


interface StudyPipelineControllerProps {
  studyId: string;
  status: string;
  analysisStatus: string;
  hasAnalysis: boolean;
}

export function StudyPipelineController({
  studyId,
  status,
  analysisStatus,
  hasAnalysis,
}: StudyPipelineControllerProps) {
  const router = useRouter();

  const [phase, setPhase] = useState<
    "idle" | "processing" | "analyzing" | "failed" | "processing-failed" | "done"
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

  const [processingError, setProcessingError] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const started = useRef(false);

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
      setErrorMessage("No pudimos analizar este estudio. Podés intentarlo nuevamente.");
      setPhase("failed");
    }
  }, [studyId, router]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function run() {
      const decision = decideAutoPipeline({ status, analysisStatus, hasAnalysis });

      if (decision.kind === "done") {
        setPhase("done");
        return;
      }

      if (decision.kind === "failed") {
        setPhase("failed");
        return;
      }

      if (decision.kind === "analyzing" && analysisStatus === "processing") {
        setPhase("analyzing");
        startPolling();
        return;
      }

      if (decision.kind === "processing") {
        setPhase("processing");
        setProcessingError(null);
        try {
          const result = await processStudyAuto(studyId);

          if (result.status === "processed") {
            await runAnalysis();
          } else {
            setProcessingError(getProcessingErrorLabel(result.processing_error));
            setPhase("processing-failed");
          }
        } catch {
          setProcessingError("No pudimos procesar este documento. Podés intentarlo nuevamente.");
          setPhase("processing-failed");
        }
        return;
      }

      await runAnalysis();
    }

    function startPolling() {
      let count = 0;
      const maxPolls = 20;
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

  if (phase === "done") return null;

  if (phase === "processing-failed") {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger-tint/50 p-5">
        <div className="mb-3 flex items-center gap-2">
          <ErrorTriangle className="h-5 w-5 text-danger" />
          <h2 className="text-body font-medium text-foreground">
            Procesamiento del documento
          </h2>
        </div>
        <p className="text-body text-danger-strong">
          {processingError ?? getProcessingErrorLabel(null)}
        </p>
        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={() => {
              setProcessingError(null);
              router.refresh();
            }}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (phase === "failed") {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger-tint/50 p-5">
        <div className="mb-3 flex items-center gap-2">
          <ErrorTriangle className="h-5 w-5 text-danger" />
          <h2 className="text-body font-medium text-foreground">
            Análisis de IA
          </h2>
        </div>
        <p className="text-body text-danger-strong">
          {errorMessage ?? getAnalysisErrorMessage("gemini_failed")}
        </p>
        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={() => {
              setErrorMessage(null);
              runAnalysis();
            }}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary-muted/50 p-5">
      <div className="flex items-center gap-3">
        <Spinner className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-body font-medium text-foreground">
            {phase === "processing"
              ? "Procesando documento…"
              : "Analizando con IA…"}
          </h2>
          <p className="mt-0.5 text-caption text-muted-foreground">
            {phase === "processing"
              ? "Extrayendo contenido del PDF. Esto tarda unos segundos."
              : "La IA está interpretando el documento. Esto puede tardar unos segundos."}
          </p>
        </div>
      </div>
    </div>
  );
}
