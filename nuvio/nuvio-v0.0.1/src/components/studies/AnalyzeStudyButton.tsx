"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestStudyAnalysis } from "@/lib/actions/studies";

interface AnalyzeStudyButtonProps {
  studyId: string;
  hasAnalysis: boolean;
}

/**
 * Fase 4.2.6 — Botón para ejecutar manualmente el análisis de IA.
 *
 * Muestra "Analizar con IA" si no existe análisis, o "Volver a analizar" si ya existe.
 * Maneja estado pending (deshabilita el botón), errores controlados y refresco
 * de la página tras éxito.
 */
export function AnalyzeStudyButton({
  studyId,
  hasAnalysis,
}: AnalyzeStudyButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (isPending) return;

    setIsPending(true);
    setError(null);

    try {
      const result = await requestStudyAnalysis(studyId);

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch {
      setError("No pudimos analizar este estudio.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={handleSubmit}
        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
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
            Analizando…
          </>
        ) : hasAnalysis ? (
          "Volver a analizar"
        ) : (
          "Analizar con IA"
        )}
      </button>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] leading-[1.5] text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
