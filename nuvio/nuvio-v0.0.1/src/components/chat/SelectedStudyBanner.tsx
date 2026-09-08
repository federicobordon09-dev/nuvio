"use client";

import { getStudyTypeLabelNullable } from "@/lib/studies-utils";
import { formatStudyDate } from "@/lib/chat/dates";
import type { SelectableStudy } from "@/lib/chat/schema";
import { CheckCircle } from "@/components/ui/icons";

interface SelectedStudyBannerProps {
  studies: SelectableStudy[];
  selectedIds: string[];
  onChangeStudy: () => void;
}

export function SelectedStudyBanner({
  studies,
  selectedIds,
  onChangeStudy,
}: SelectedStudyBannerProps) {
  const selected = studies.filter((s) => selectedIds.includes(s.id));

  if (selected.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-primary-muted/60 px-3 py-3">
      <span
        className="inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wide text-primary"
        aria-hidden="true"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <CheckCircle className="h-3.5 w-3.5" />
        </span>
        Estudio seleccionado
      </span>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {selected.map((study) => {
          const label = getStudyTypeLabelNullable(study.study_type);
          const date = formatStudyDate(study.created_at ?? undefined);
          return (
            <span
              key={study.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-primary/20 bg-surface px-2.5 py-1 text-[12px] font-medium text-foreground"
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
        className="ml-auto inline-flex shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-surface px-3 py-2 text-[12px] font-medium text-primary transition-colors hover:bg-primary-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
        aria-label="Cambiar el estudio seleccionado"
      >
        Cambiar estudio
      </button>
    </div>
  );
}