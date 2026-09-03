"use client";

import { getStudyTypeLabel, type StudyType } from "@/lib/studies-utils";
import { formatStudyDate } from "@/lib/chat/dates";
import type { SelectableStudy } from "@/lib/chat/schema";

interface SelectedStudyBannerProps {
  studies: SelectableStudy[];
  selectedIds: string[];
  /** Vuelve al selector de estudios (estado de captura). */
  onChangeStudy: () => void;
}

/**
 * Banner "Estudio seleccionado" — muestra claramente qué estudio(s) están
 * en uso como contexto y deja una acción evidente "Cambiar estudio".
 * Se usa en la visita guiada antes del chat y encima del chat activo.
 */
export function SelectedStudyBanner({
  studies,
  selectedIds,
  onChangeStudy,
}: SelectedStudyBannerProps) {
  const selected = studies.filter((s) => selectedIds.includes(s.id));

  if (selected.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-ocean-tint/60 px-3 py-3">
      <span
        className="inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wide text-ocean-dark"
        aria-hidden="true"
      >
        {/* check/document badge — refuerza "usando este estudio" */}
        <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-ocean text-white">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </span>
        Estudio seleccionado
      </span>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {selected.map((study) => {
          const label = getStudyTypeLabel(study.study_type as StudyType);
          const date = formatStudyDate(study.created_at ?? undefined);
          return (
            <span
              key={study.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-ocean/20 bg-surface px-2.5 py-1 text-[12px] font-medium text-foreground"
            >
              <span className="max-w-[170px] truncate">{study.file_name}</span>
              <span className="hidden sm:inline text-muted-foreground/70">
                · {label}
              </span>
              {date && (
                <span className="hidden sm:inline text-muted-foreground/70">
                  · {date}
                </span>
              )}
            </span>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onChangeStudy}
        className="ml-auto inline-flex shrink-0 items-center justify-center rounded-lg border border-ocean/30 bg-surface px-3 py-2 text-[12px] font-medium text-ocean transition-colors hover:bg-surface hover:text-ocean-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean focus-visible:ring-offset-1"
        aria-label="Cambiar el estudio seleccionado"
      >
        Cambiar estudio
      </button>
    </div>
  );
}