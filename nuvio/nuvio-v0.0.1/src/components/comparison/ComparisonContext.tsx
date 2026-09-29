import Link from "next/link";
import { getStudyTypeLabelNullable, formatFileSize, type StudyType } from "@/lib/studies-utils";
import type { ComparisonStudy } from "@/lib/comparison/presentation";
import { Clock, Document } from "@/components/ui/icons";

/**
 * Diferencia absoluta en días entre las fechas de ambos estudios.
 * Devuelve null si alguna de las dos fechas no es interpretable.
 * El número mostrado sale siempre de los `created_at` reales.
 */
function intervalInDays(from: string, to: string): number | null {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round(Math.abs(b - a) / 86_400_000);
}

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

  const interval = intervalInDays(studyA.created_at, studyB.created_at);

  const renderStudyCard = (
    study: ComparisonStudy,
    label: "Anterior" | "Posterior"
  ) => {
    const isPosterior = label === "Posterior";

    return (
      <article
        className={`flex min-w-0 flex-col rounded-[20px] border border-border p-5 ${
          isPosterior ? "bg-primary-muted/40" : "bg-surface"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <span
            aria-hidden="true"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              isPosterior
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isPosterior ? (
              <Document className="h-5 w-5" />
            ) : (
              <Clock className="h-5 w-5" />
            )}
          </span>
          <span
            className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase leading-4 tracking-[0.04em] ${
              isPosterior
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {label}
          </span>
        </div>

        <Link
          href={`/dashboard/estudios/${study.id}`}
          className="mt-3 flex min-h-[44px] min-w-0 items-center"
        >
          <p className="min-w-0 truncate text-body font-medium leading-snug text-foreground transition-colors hover:text-primary">
            {study.file_name}
          </p>
        </Link>

        <p className="text-caption text-muted-foreground">
          {getStudyTypeLabelNullable(study.study_type as StudyType | null)}
        </p>

        <dl className="mt-3 grid grid-cols-2 gap-2">
          <div>
            <dt className="data-label">
              Fecha
            </dt>
            <dd className="mt-0.5 text-caption font-medium tabular-nums text-foreground">
              {formatDate(study.created_at)}
            </dd>
          </div>
          <div>
            <dt className="data-label">
              Tamaño
            </dt>
            <dd className="mt-0.5 text-caption font-medium tabular-nums text-foreground">
              {formatFileSize(study.file_size)}
            </dd>
          </div>
        </dl>
      </article>
    );
  };

  return (
    <section aria-labelledby="comparison-studies-heading">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="comparison-studies-heading" className="text-subheading text-primary">
          Estudios comparados
        </h2>
        {interval !== null && (
          <p className="text-caption text-muted-foreground">
            Intervalo:{" "}
            <span className="font-medium tabular-nums text-foreground">
              {interval}
            </span>{" "}
            {interval === 1 ? "día" : "días"}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {renderStudyCard(studyA, "Anterior")}
        {renderStudyCard(studyB, "Posterior")}
      </div>
    </section>
  );
}
