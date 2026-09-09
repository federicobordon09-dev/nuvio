import type { ParameterTrack } from "@/lib/evolution/types";
import {
  buildSparklineModel,
  computeSparklineLayout,
  sparklineSummaryText,
  sparklineDirectionLabel,
  sparklineDirectionSymbol,
} from "@/lib/evolution/sparkline";

/**
 * Fase 10.6 — Sparkline (tendencia visual) de un parámetro longitudinal.
 *
 * Componente de servidor (SVG inline, sin interactividad): complementa la
 * tabla de evolución, que sigue siendo la fuente principal.
 *
 * - No se grafica si hay < 3 puntos numéricos (placeholder atenuado).
 * - Conecta solo puntos numéricos adyacentes, con unidades compatibles y
 *   sin huecos; los datos faltantes NO se interpola.
 * - La dirección se comunica con símbolo + texto (↑/↓/·), no solo con color.
 * - Accesibilidad: role="img" + aria-label + <title> con el resumen textual.
 * - Responsive: el SVG escala al ancho disponible (viewBox + width 100%).
 */

/** Ancho/alto del espacio de coordenadas del viewBox. */
const VIEWBOX_WIDTH = 200;
const VIEWBOX_HEIGHT = 52;

export function ParameterSparkline({
  track,
  studyIds,
}: {
  track: ParameterTrack;
  studyIds: string[];
}) {
  const model = buildSparklineModel(track, studyIds);

  if (model.kind === "no_render") {
    return (
      <span
        className="text-[12px] text-muted-foreground/70"
        title="No hay suficientes valores numéricos para graficar la tendencia"
        aria-label="No hay suficientes valores numéricos para graficar la tendencia"
      >
        —
      </span>
    );
  }

  const layout = computeSparklineLayout(model, VIEWBOX_WIDTH, VIEWBOX_HEIGHT);
  if (layout === null) return null; // defensivo: ya cubierto por no_render

  const summary = sparklineSummaryText(model);
  const directionLabel = sparklineDirectionLabel(model);
  const directionSymbol = sparklineDirectionSymbol(model);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg
        role="img"
        aria-label={summary}
        viewBox={layout.viewBox}
        width="100%"
        preserveAspectRatio="none"
        className="h-11 max-w-[11rem] min-w-[5rem]"
      >
        <title>{summary}</title>
        {layout.polylines.map((polyline, i) => (
          <polyline
            key={`l-${i}`}
            points={polyline.points}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="text-violet"
          />
        ))}
        {layout.points.map((pt, i) => (
          <circle
            key={`p-${pt.studyId}-${i}`}
            cx={pt.x}
            cy={pt.y}
            r={2.75}
            className="fill-violet"
          />
        ))}
      </svg>
      <span className="inline-flex items-center gap-1 text-[11px] font-medium tabular-nums text-muted-foreground">
        <span aria-hidden="true">{directionSymbol}</span>
        <span>{directionLabel}</span>
      </span>
    </div>
  );
}
