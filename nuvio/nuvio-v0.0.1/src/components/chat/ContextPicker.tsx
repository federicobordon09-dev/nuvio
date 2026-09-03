"use client";

import { useState } from "react";
import { setContextAction } from "@/lib/actions/chat";
import { getStudyTypeLabel, type StudyType } from "@/lib/studies-utils";
import type { SelectableStudy } from "@/lib/chat/schema";

interface ContextPickerProps {
  conversationId: string;
  selectableStudies: SelectableStudy[];
  initialContextStudyIds: string[];
}

/**
 * Selector de estudios de contexto de la conversación.
 * Muestra los estudios listos del usuario como chips conmutables.
 * Cada cambio se persiste vía server action (setContextAction).
 */
export function ContextPicker({
  conversationId,
  selectableStudies,
  initialContextStudyIds,
}: ContextPickerProps) {
  const [selected, setSelected] = useState<string[]>(initialContextStudyIds);
  const [error, setError] = useState<string | null>(null);

  async function toggle(studyId: string, checked: boolean) {
    setError(null);
    const next = checked
      ? [...selected, studyId]
      : selected.filter((id) => id !== studyId);
    // Optimistic update; revert si falla.
    const prev = selected;
    setSelected(next);

    const formData = new FormData();
    formData.set("conversationId", conversationId);
    for (const id of next) formData.append("studyId", id);

    try {
      await setContextAction(formData);
    } catch {
      setSelected(prev);
      setError("No pudimos actualizar el contexto.");
    }
  }

  return (
    <div>
      <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
        Estudios de contexto
      </p>
      {selectableStudies.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">
          No tenés estudios listos. Analizá un estudio para poder consultarlo acá.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {selectableStudies.map((study) => {
            const checked = selected.includes(study.id);
            return (
              <label
                key={study.id}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  checked
                    ? "border-ocean bg-ocean-tint text-ocean-dark"
                    : "border-border bg-surface text-muted-foreground hover:border-ocean/30 hover:text-foreground"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={(e) => toggle(study.id, e.target.checked)}
                />
                <span
                  className={`h-1.5 w-1.5 rounded-full ${checked ? "bg-ocean" : "bg-muted-foreground/40"}`}
                />
                <span className="max-w-[160px] truncate">{study.file_name}</span>
                <span className="text-muted-foreground/70">
                  {getStudyTypeLabel(study.study_type as StudyType)}
                </span>
              </label>
            );
          })}
        </div>
      )}
      {error && <p className="mt-2 text-[12px] text-danger">{error}</p>}
    </div>
  );
}
