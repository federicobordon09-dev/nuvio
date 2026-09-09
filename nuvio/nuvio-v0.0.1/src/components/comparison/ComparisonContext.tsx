import Link from "next/link";
import { getStudyTypeLabelNullable, formatFileSize, type StudyType } from "@/lib/studies-utils";
import type { ComparisonStudy } from "@/lib/comparison/presentation";

export function ComparisonContext({
  studyA,
  studyB,
}: {
  studyA: ComparisonStudy;
  studyB: ComparisonStudy;
}) {
  const formatDate = (iso: string): string => {
    try {
      return new Date(iso).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const renderStudyCard = (
    study: ComparisonStudy,
    label: "Anterior" | "Posterior"
  ) => (
    <div className="flex min-w-0 flex-col rounded-xl border border-border bg-surface p-5">
      <span
        className={`inline-flex w-fit shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
          label === "Anterior"
            ? "bg-primary-muted text-primary"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {label}
      </span>

      <Link
        href={`/dashboard/estudios/${study.id}`}
        className="mt-3 min-w-0"
      >
        <p className="truncate text-body font-medium leading-snug text-foreground transition-colors hover:text-primary">
          {study.file_name}
        </p>
      </Link>

      <p className="mt-1 text-caption text-muted-foreground">
        {getStudyTypeLabelNullable(study.study_type as StudyType | null)}
      </p>

      <dl className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <dt className="data-label">
            Fecha
          </dt>
          <dd className="mt-0.5 text-caption font-medium text-foreground">
            {formatDate(study.created_at)}
          </dd>
        </div>
        <div>
          <dt className="data-label">
            Tamaño
          </dt>
          <dd className="mt-0.5 text-caption font-medium text-foreground">
            {formatFileSize(study.file_size)}
          </dd>
        </div>
      </dl>
    </div>
  );

  return (
    <section aria-label="Estudios comparados">
      <h2 className="mb-3 data-label">
        Estudios comparados
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {renderStudyCard(studyA, "Anterior")}
        {renderStudyCard(studyB, "Posterior")}
      </div>
    </section>
  );
}
