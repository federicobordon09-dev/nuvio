import type { ComparisonResult } from "@/lib/comparison/types";
import { computeComparisonTiles } from "@/lib/comparison/presentation";

function SummaryTile({
  tile,
  prominent = false,
}: {
  tile: { label: string; value: number; tone: string };
  prominent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-muted/50 p-3">
      <dd
        className={`w-fit rounded-full px-2.5 py-0.5 font-semibold tabular-nums ${tile.tone} ${
          prominent ? "text-body" : "text-caption"
        }`}
      >
        {tile.value}
      </dd>
      <dt className="text-caption leading-tight text-muted-foreground">
        {tile.label}
      </dt>
    </div>
  );
}

export function ComparisonSummary({
  result,
}: {
  result: Extract<ComparisonResult, { comparable: true }>;
}) {
  const tiles = computeComparisonTiles(result);
  const primary = tiles.filter((t) => t.group === "primary");
  const secondary = tiles.filter((t) => t.group === "secondary");

  return (
    <section
      aria-labelledby="comparison-summary-heading"
      className="animate-fade-in-up rounded-xl border border-border bg-surface p-5"
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="comparison-summary-heading"
          className="text-body font-medium text-foreground"
        >
          Resumen de cambios
        </h2>
        <p className="text-caption text-muted-foreground">
          Contadores objetivos entre ambos estudios
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {primary.map((tile) => (
          <SummaryTile key={tile.key} tile={tile} prominent />
        ))}
      </dl>

      {secondary.length > 0 && (
        <details className="group mt-4 border-t border-border pt-4">
          <summary className="cursor-pointer list-none text-caption font-medium text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="transition-transform group-open:rotate-90"
              >
                ▸
              </span>
              Ver más detalle
            </span>
          </summary>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {secondary.map((tile) => (
              <SummaryTile key={tile.key} tile={tile} />
            ))}
          </dl>
        </details>
      )}
    </section>
  );
}
