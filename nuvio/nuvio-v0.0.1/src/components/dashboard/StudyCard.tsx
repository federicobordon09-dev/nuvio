import Link from "next/link";
import { formatFileSize, getStudyTypeLabel } from "@/lib/studies-utils";
import type { StudyType } from "@/lib/studies-utils";
import { StudyStatusBadge } from "./StudyStatusBadge";
import { StudyDeleteButton } from "./StudyDeleteButton";

interface StudyCardProps {
  study: {
    id: string;
    file_name: string;
    study_type: StudyType;
    status: string;
    analysis_status: string;
    file_size: number;
    created_at: string;
  };
  /** Muestra el botón de eliminación (se omite en secciones como "recientes"). */
  showDelete?: boolean;
}

/**
 * Tarjeta de un estudio en las listas. El área principal enlaza al detalle;
 * el botón de eliminar (si se muestra) queda fuera del enlace.
 */
export function StudyCard({ study, showDelete = true }: StudyCardProps) {
  return (
    <div className="rounded-xl border border-ink-700/10 bg-white p-5 shadow-[0_1px_2px_rgba(11,20,38,0.04)] transition-colors hover:border-primary-300 hover:bg-primary-50/30">
      <div className="flex items-start justify-between gap-4">
        <Link
          href={`/dashboard/estudios/${study.id}`}
          className="min-w-0 flex-1"
        >
          <p className="truncate text-[15px] font-medium text-foreground transition-colors hover:text-primary-600">
            {study.file_name}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {getStudyTypeLabel(study.study_type)}
          </p>
          <div className="mt-2">
            <StudyStatusBadge
              status={study.status}
              analysisStatus={study.analysis_status}
            />
          </div>
        </Link>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
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
