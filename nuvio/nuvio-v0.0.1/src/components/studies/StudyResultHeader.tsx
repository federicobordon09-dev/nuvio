"use client";

import type { StudyType } from "@/lib/studies-utils";
import { getStudyTypeLabel } from "@/lib/studies-utils";
import { StudyStatusBadge } from "@/components/dashboard/StudyStatusBadge";

interface StudyResultHeaderProps {
  studyType: StudyType | null;
  documentType: string;
  summary: string;
  status: string;
  analysisStatus: string | null;
}

/**
 * Encabezado del resultado del estudio.
 * Muestra el estado, tipo de estudio, tipo de documento y el resumen del análisis.
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
      className="rounded-xl border border-border bg-surface p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="study-result-header-heading"
          className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Resultado del análisis
        </h2>
        <StudyStatusBadge status={status} analysisStatus={analysisStatus ?? undefined} />
      </div>

      {(studyType || documentType) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {studyType && (
            <span className="rounded-full bg-ocean-tint px-3 py-1 text-[12px] font-medium text-ocean-dark">
              {getStudyTypeLabel(studyType)}
            </span>
          )}
          {documentType && (
            <span className="rounded-full bg-muted px-3 py-1 text-[12px] font-medium text-muted-foreground">
              {documentType}
            </span>
          )}
        </div>
      )}

      <p className="text-[15px] leading-[1.6] text-foreground">{summary}</p>
    </section>
  );
}
