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

export function StudyResultHeader({
  studyType,
  documentType,
  summary,
  status,
  analysisStatus,
}: StudyResultHeaderProps) {
  return (
    <section aria-labelledby="study-result-header-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="study-result-header-heading"
          className="data-label"
        >
          Resultado del análisis
        </h2>
        <StudyStatusBadge status={status} analysisStatus={analysisStatus ?? undefined} />
      </div>

      {(studyType || documentType) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {studyType && (
            <span className="rounded-full bg-primary-muted px-3 py-1 text-caption font-medium text-primary">
              {getStudyTypeLabel(studyType)}
            </span>
          )}
          {documentType && (
            <span className="rounded-full bg-muted/50 px-3 py-1 text-caption font-medium text-muted-foreground">
              {documentType}
            </span>
          )}
        </div>
      )}

      <p className="text-body leading-body text-foreground">{summary}</p>
    </section>
  );
}
