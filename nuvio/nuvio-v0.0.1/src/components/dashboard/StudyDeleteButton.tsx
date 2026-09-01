"use client";

import { useTransition } from "react";
import { deleteStudy } from "@/lib/actions/studies";

export function StudyDeleteButton({ studyId }: { studyId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        startTransition(async () => {
          await deleteStudy(studyId);
        });
      }}
      disabled={pending}
      className="rounded-lg px-4 py-2.5 text-[14px] font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
    >
      {pending ? "Eliminando…" : "Eliminar"}
    </button>
  );
}