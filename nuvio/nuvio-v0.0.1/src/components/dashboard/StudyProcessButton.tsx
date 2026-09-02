"use client";

import { processStudyAction } from "@/lib/actions/studies";

export function StudyProcessButton({ studyId }: { studyId: string }) {
  return (
    <form action={processStudyAction}>
      <input type="hidden" name="studyId" value={studyId} />
      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-lg border border-ocean/20 bg-ocean-tint px-4 py-2.5 text-[14px] font-medium text-ocean-dark transition-colors hover:bg-ocean-tint/60"
      >
        Procesar documento
      </button>
    </form>
  );
}