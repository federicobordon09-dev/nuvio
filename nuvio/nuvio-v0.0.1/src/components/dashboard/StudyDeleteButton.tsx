"use client";

import { deleteStudyAction } from "@/lib/actions/studies";

export function StudyDeleteButton({ studyId }: { studyId: string }) {
  return (
    <form action={deleteStudyAction}>
      <input type="hidden" name="studyId" value={studyId} />
      <button
        type="submit"
        className="rounded-lg px-4 py-2.5 text-[14px] font-medium text-red-700 transition-colors hover:bg-red-50"
      >
        Eliminar
      </button>
    </form>
  );
}