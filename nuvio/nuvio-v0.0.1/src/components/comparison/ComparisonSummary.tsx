import type { ComparisonResult } from "@/lib/comparison/types";
import { computeComparisonTiles } from "@/lib/comparison/presentation";

// ── Comparación: resumen visual de cambios ──────────────────────────────

/**
 * Resumen numérico de la comparación.
 * Cada tile muestra un contador derivado exclusivamente de compareStudies().
 * Los contadores son informativos y NO implican conclusiones clínicas.
 */
export function ComparisonSummary({
  result,
}: {
  result: Extract<ComparisonResult, { comparable: true }>;
}) {
  const tiles = computeComparisonTiles(result);

  return (
    <section
      aria-labelledby="comparison-summary-heading"
      className="rounded-xl border border-border bg-surface p-5"
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="comparison-summary-heading"
          className="text-[15px] font-medium text-foreground"
        >
          Resumen de cambios
        </h2>
        <p className="text-[12px] text-muted-foreground">
          Contadores objetivos entre ambos estudios
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((tile) => (
          <div
            key={tile.key}
            className="flex flex-col gap-1.5 rounded-lg bg-muted p-3"
          >
            <dd className={`w-fit rounded-full px-2 py-0.5 text-[13px] font-semibold tabular-nums ${tile.tone}`}>
              {tile.value}
            </dd>
            <dt className="text-[12px] leading-[1.4] text-muted-foreground">
              {tile.label}
            </dt>
          </div>
        ))}
      </dl>
    </section>
  );
}