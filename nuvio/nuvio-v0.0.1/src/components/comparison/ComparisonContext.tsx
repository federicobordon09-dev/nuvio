import Link from "next/link";
import { getStudyTypeLabelNullable, formatFileSize, type StudyType } from "@/lib/studies-utils";
import type { ComparisonStudy } from "@/lib/comparison/presentation";

// ── Comparación: contexto de los dos estudios ───────────────────────────

/**
 * Muestra los dos estudios comparados lado a lado, identificados como
 * "Anterior" (study A = primero en la URL) y "Posterior" (study B).
 *
 * Usa el patrón StudyCard (nombre + tipo + meta), fiel al dashboard.
 */
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
    <div className="flex min-w-0 flex-col rounded-xl border border-border bg-surface p-4 sm:p-5">
      <span
        className={`inline-flex w-fit shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
          label === "Anterior"
            ? "bg-ocean-tint text-ocean"
            : "bg-ocean text-white"
        }`}
      >
        {label}
      </span>

      <Link
        href={`/dashboard/estudios/${study.id}`}
        className="mt-3 min-w-0"
      >
        <p className="truncate text-[15px] font-medium leading-snug text-foreground transition-colors hover:text-ocean">
          {study.file_name}
        </p>
      </Link>

      <p className="mt-1 text-[13px] text-muted-foreground">
        {getStudyTypeLabelNullable(study.study_type as StudyType | null)}
      </p>

      <dl className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Fecha
          </dt>
          <dd className="mt-0.5 text-[13px] font-medium text-foreground">
            {formatDate(study.created_at)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Tamaño
          </dt>
          <dd className="mt-0.5 text-[13px] font-medium text-foreground">
            {formatFileSize(study.file_size)}
          </dd>
        </div>
      </dl>
    </div>
  );

  return (
    <section aria-label="Estudios comparados">
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
        Estudios comparados
      </h2>
      {/* Desktop: dos tarjetas con separador visible. Mobile: grid apilado. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {renderStudyCard(studyA, "Anterior")}
        {renderStudyCard(studyB, "Posterior")}
      </div>
    </section>
  );
}
