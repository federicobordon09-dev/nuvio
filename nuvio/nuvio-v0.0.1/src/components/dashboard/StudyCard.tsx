import Link from "next/link";
import { formatFileSize, getStudyTypeLabelNullable } from "@/lib/studies-utils";
import type { StudyType } from "@/lib/studies-utils";
import { StudyStatusBadge } from "./StudyStatusBadge";
import { StudyDeleteButton } from "./StudyDeleteButton";

interface StudyCardProps {
  study: {
    id: string;
    file_name: string;
    study_type: StudyType | null;
    status: string;
    analysis_status: string;
    file_size: number;
    created_at: string;
  };
  showDelete?: boolean;
}

export function StudyCard({ study, showDelete = true }: StudyCardProps) {
  return (
    <div className="group rounded-xl border border-border bg-surface p-5 transition-all duration-150 ease-out hover:shadow-md hover:border-primary/20 hover:bg-primary-muted/30 animate-fade-in-up">
      <div className="flex items-start justify-between gap-4">
        <Link
          href={`/dashboard/estudios/${study.id}`}
          className="min-w-0 flex-1"
        >
          <p className="truncate text-body font-medium text-foreground transition-colors group-hover:text-primary">
            {study.file_name}
          </p>
          <p className="mt-1 text-caption text-muted-foreground">
            {getStudyTypeLabelNullable(study.study_type)}
          </p>
          <div className="mt-3">
            <StudyStatusBadge
              status={study.status}
              analysisStatus={study.analysis_status}
            />
          </div>
        </Link>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-3 text-caption text-muted-foreground">
            <span>{formatFileSize(study.file_size)}</span>
            <span>{new Date(study.created_at).toLocaleDateString("es-AR")}</span>
          </div>
          {showDelete && (
            <StudyDeleteButton studyId={study.id} studyName={study.file_name} />
          )}
        </div>
      </div>
    </div>
  );
}
