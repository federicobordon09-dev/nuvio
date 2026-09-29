"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestStudyAnalysis } from "@/lib/actions/studies";
import { Button } from "@/components/ui/Button";

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
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        variant="secondary"
        size="md"
        loading={isPending}
        onClick={handleSubmit}
      >
        {isPending
          ? "Analizando…"
          : hasAnalysis
            ? "Volver a analizar"
            : "Analizar con IA"}
      </Button>

      {error && (
        <p className="rounded-lg bg-danger-tint px-3 py-2 text-[13px] leading-[1.5] text-danger-strong">
          {error}
        </p>
      )}
    </div>
  );
}
