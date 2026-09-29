import type { ComparisonResult } from "@/lib/comparison/types";
import { computeComparisonTiles } from "@/lib/comparison/presentation";

/**
 * Tile de resumen: el tono viene del motor de presentación (lib) y tiñe
 * fondo y texto; el número es un contador real de `compareStudies()`.
 * `font-variant-numeric: tabular-nums` en todo valor numérico (DESIGN.md).
 */
function SummaryTile({
  tile,
  prominent = false,
}: {
  tile: { label: string; value: number; tone: string };
  prominent?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-2 rounded-xl p-4 ${tile.tone}`}>
      <dt className="order-2 text-caption font-medium leading-tight">
        {tile.label}
      </dt>
      <dd
        className={`order-1 tabular-nums ${
          prominent
            ? "font-heading text-[1.75rem] font-bold leading-8 tracking-[-0.02em]"
            : "text-subheading"
        }`}
      >
        {tile.value}
      </dd>
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
      className="animate-fade-in-up rounded-[20px] border border-border bg-surface p-5 sm:p-6"
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="comparison-summary-heading"
          className="text-subheading text-primary"
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
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center text-caption font-medium text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
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
