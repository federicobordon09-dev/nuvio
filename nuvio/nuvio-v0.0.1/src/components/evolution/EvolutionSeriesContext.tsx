import Link from "next/link";
import { SERIES_LETTERS } from "@/lib/evolution/selection";
import type { EvolutionContextStudy } from "@/lib/evolution/presentation";
import {
  formatLongDate,
  getSeriesDateRangeLabel,
} from "@/lib/evolution/presentation";

export function EvolutionSeriesContext({
  studies,
  typeLabel,
}: {
  studies: EvolutionContextStudy[];
  typeLabel: string;
}) {
  return (
    <section aria-labelledby="evolution-series-heading">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="evolution-series-heading"
          className="text-subheading text-primary"
        >
          La serie · {typeLabel}
        </h2>
        <span className="text-caption text-muted-foreground">
          <span className="tabular-nums">{studies.length}</span>{" "}
          estudio{studies.length !== 1 ? "s" : ""} ·{" "}
          <span className="tabular-nums">{getSeriesDateRangeLabel(studies)}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {studies.map((study, i) => (
          <article
            key={study.id}
            className="flex min-w-0 flex-col rounded-[20px] border border-border bg-surface p-4"
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet text-[12px] font-semibold text-white"
              >
                {SERIES_LETTERS[i]}
              </span>
              <span className="data-label">
                Estudio {i + 1} de {studies.length}
              </span>
            </div>

            <Link
              href={`/dashboard/estudios/${study.id}`}
              className="mt-3 flex min-h-[44px] min-w-0 items-center"
            >
              <p className="min-w-0 truncate text-body font-medium leading-snug text-foreground transition-colors hover:text-violet">
                {study.file_name}
              </p>
            </Link>

            <p className="text-caption tabular-nums text-muted-foreground">
              {formatLongDate(study.created_at)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
