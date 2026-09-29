"use client";

import { processStudyAction } from "@/lib/actions/studies";

export function StudyProcessButton({ studyId }: { studyId: string }) {
  return (
    <form action={processStudyAction}>
      <input type="hidden" name="studyId" value={studyId} />
      <button
        type="submit"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border-strong bg-surface px-4 py-2.5 text-body font-medium text-primary transition-colors duration-150 hover:bg-background active:scale-[0.99]"
      >
        Procesar documento
      </button>
    </form>
  );
}