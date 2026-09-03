"use client";

import { getStudyTypeLabel, type StudyType } from "@/lib/studies-utils";
import type { SelectableStudy } from "@/lib/chat/schema";

interface ContextPickerProps {
  /** Estudios del usuario listos para usar como contexto. */
  studies: SelectableStudy[];
  /** IDs de estudios seleccionados (estado controlado por el padre). */
  selectedIds: string[];
  /** Cambia la selección; el padre persiste vía setContextAction. */
  onToggle: (studyId: string, checked: boolean) => void;
  /** Error de persistencia mostrado al usuario (si el padre lo padece). */
  error?: string | null;
}

/**
 * Selector de estudios de contexto de la conversación como chips conmutables.
 * Es un componente controlado: el estado de selección y la persistencia viven
 * en ChatView, que orquesta la experiencia guiada del chat.
 */
export function ContextPicker({
  studies,
  selectedIds,
  onToggle,
  error,
}: ContextPickerProps) {
  return (
    <div>
      <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
        Estudios de contexto
      </p>
      {studies.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">
          No tenés estudios listos. Analizá un estudio para poder consultarlo acá.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {studies.map((study) => {
            const checked = selectedIds.includes(study.id);
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
                  onChange={(e) => onToggle(study.id, e.target.checked)}
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