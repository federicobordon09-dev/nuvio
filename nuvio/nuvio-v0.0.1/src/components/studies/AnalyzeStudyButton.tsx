"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestStudyAnalysis } from "@/lib/actions/studies";
import { Spinner } from "@/components/ui/Spinner";

interface AnalyzeStudyButtonProps {
  studyId: string;
  hasAnalysis: boolean;
}

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
        className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-[14px] font-medium text-primary transition-colors hover:bg-primary-muted disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Spinner className="h-4 w-4" />
            Analizando…
          </>
        ) : hasAnalysis ? (
          "Volver a analizar"
        ) : (
          "Analizar con IA"
        )}
      </button>

      {error && (
        <p className="rounded-lg bg-danger-tint px-3 py-2 text-[13px] leading-[1.5] text-danger-strong">
          {error}
        </p>
      )}
    </div>
  );
}
