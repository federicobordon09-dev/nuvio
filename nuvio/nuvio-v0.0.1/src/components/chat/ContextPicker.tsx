"use client";

import { getStudyTypeLabelNullable } from "@/lib/studies-utils";
import type { SelectableStudy } from "@/lib/chat/schema";

interface ContextPickerProps {
  studies: SelectableStudy[];
  selectedIds: string[];
  onToggle: (studyId: string, checked: boolean) => void;
  error?: string | null;
}

export function ContextPicker({
  studies,
  selectedIds,
  onToggle,
  error,
}: ContextPickerProps) {
  return (
    <div>
      <p className="data-label mb-2">Estudios de contexto</p>
      {studies.length === 0 ? (
        <p className="text-caption text-muted-foreground">
          No tenés estudios listos. Analizá un estudio para poder consultarlo
          acá.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2" role="list">
          {studies.map((study) => {
            const checked = selectedIds.includes(study.id);
            return (
              <li key={study.id}>
                <label
                  className={`relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-caption font-medium transition-colors duration-150 ${
                    checked
                      ? "border-primary bg-primary-muted text-primary"
                      : "border-border-strong bg-surface text-muted-foreground hover:border-lilac-glow hover:text-foreground"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={checked}
                    onChange={(e) => onToggle(study.id, e.target.checked)}
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-xl peer-focus-visible:ring-2 peer-focus-visible:ring-lilac-glow peer-focus-visible:ring-offset-2"
                  />
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      checked ? "bg-primary" : "bg-outline-variant"
                    }`}
                    aria-hidden="true"
                  />
                  <span className="max-w-[160px] truncate">
                    {study.file_name}
                  </span>
                  <span className="text-plum-muted">
                    {getStudyTypeLabelNullable(study.study_type)}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
      {error && <p className="mt-2 text-caption text-danger">{error}</p>}
    </div>
  );
}
