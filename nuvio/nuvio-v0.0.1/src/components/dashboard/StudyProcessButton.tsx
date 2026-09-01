"use client";

import { processStudyAction } from "@/lib/actions/studies";

export function StudyProcessButton({ studyId }: { studyId: string }) {
  return (
    <form action={processStudyAction}>
      <input type="hidden" name="studyId" value={studyId} />
      <button
        type="submit"
        className="inline-flex items-center rounded-lg border border-primary-200 bg-primary-50 px-4 py-2.5 text-[14px] font-medium text-primary-700 transition-colors hover:bg-primary-100"
      >
        Procesar documento
      </button>
    </form>
  );
}