"use client";

import type { StudyType } from "@/lib/studies-utils";
import { getStudyTypeLabel } from "@/lib/studies-utils";
import { StudyStatusBadge } from "@/components/dashboard/StudyStatusBadge";
import { Sparkles } from "@/components/ui/icons";

interface StudyResultHeaderProps {
  studyType: StudyType | null;
  documentType: string;
  summary: string;
  status: string;
  analysisStatus: string | null;
}

/**
 * Resumen editorial del análisis — la "Explicación en lenguaje sencillo".
 * Card blanco con radio 20px y borde hairline (DESIGN.md).
 * El contenido sale íntegro del payload: `document_type`, `study_type`,
 * `summary` y el stage real del estudio.
 */
export function StudyResultHeader({
  studyType,
  documentType,
  summary,
  status,
  analysisStatus,
}: StudyResultHeaderProps) {
  return (
    <section
      aria-labelledby="study-result-header-heading"
      className="rounded-[20px] border border-border bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-primary"
          >
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2
              id="study-result-header-heading"
              className="text-subheading text-primary"
            >
              Explicación en lenguaje sencillo
            </h2>
            <p className="mt-0.5 text-caption text-muted-foreground">
              Nuvio explica lo que encontró en este documento
            </p>
          </div>
        </div>
        <StudyStatusBadge
          status={status}
          analysisStatus={analysisStatus ?? undefined}
        />
      </div>

      {(studyType || documentType) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {studyType && (
            <span className="inline-flex items-center rounded-full bg-primary-muted px-3 py-1 text-caption font-semibold text-primary">
              {getStudyTypeLabel(studyType)}
            </span>
          )}
          {documentType && (
            <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-caption font-medium text-muted-foreground">
              {documentType}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 rounded-xl bg-background p-4">
        <p className="text-body leading-relaxed text-foreground">{summary}</p>
      </div>
    </section>
  );
}
