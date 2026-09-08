import type { EvolutionOverall } from "@/lib/evolution/types";
import { computeEvolutionTiles } from "@/lib/evolution/presentation";

// ── Evolución: resumen numérico de la serie ──────────────────────────────

/** Tile del resumen. */
function SummaryTile({
  tile,
  prominent = false,
}: {
  tile: { label: string; value: number; tone: string };
  prominent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-muted p-3">
      <dd
        className={`w-fit rounded-full px-2.5 py-0.5 font-semibold tabular-nums ${tile.tone} ${
          prominent ? "text-[15px]" : "text-[13px]"
        }`}
      >
        {tile.value}
      </dd>
      <dt className="text-[12px] leading-[1.4] text-muted-foreground">
        {tile.label}
      </dt>
    </div>
  );
}

/**
 * Resumen numérico de la evolución.
 * Jerarquía (Fase 10.5): primero "qué cambió" (tiles primarios en violeta),
 * luego el detalle (tiles secundarios en una sección plegable y subordinada).
 * Los contadores son informativos: no implican conclusiones clínicas.
 */
export function EvolutionOverview({
  overall,
}: {
  overall: EvolutionOverall;
}) {
  const tiles = computeEvolutionTiles(overall);
  const primary = tiles.filter((t) => t.group === "primary");
  const secondary = tiles.filter((t) => t.group === "secondary");

  return (
    <section
      aria-labelledby="evolution-summary-heading"
      className="rounded-xl border border-border bg-surface p-5"
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="evolution-summary-heading"
          className="text-[15px] font-medium text-foreground"
        >
          Resumen de la evolución
        </h2>
        <p className="text-[12px] text-muted-foreground">
          Contadores objetivos a lo largo de la serie
        </p>
      </div>

      {/* Primario: qué cambió */}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {primary.map((tile) => (
          <SummaryTile key={tile.key} tile={tile} prominent />
        ))}
      </dl>

      {/* Secundario: detalle, plegable para no saturar */}
      {secondary.length > 0 && (
        <details className="group mt-4 border-t border-border pt-4">
          <summary className="cursor-pointer list-none text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
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