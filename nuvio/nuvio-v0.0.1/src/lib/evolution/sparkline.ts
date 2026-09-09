/**
 * Fase 10.6 — Lógica pura de la visualización longitudinal (sparkline).
 *
 * Transforma un `ParameterTrack` (Fase 10.4) en un modelo de sparkline
 * (tendencia visual) y, opcionalmente, en coordenadas SVG listas para
 * renderizar. Sin dependencias React ni de framework; testeable unitariamente.
 *
 * Contrato de visualización (objetivo y técnico, sin interpretación clínica):
 * - Se grafica un parámetro cuando tiene >= 3 puntos numéricos.
 * - Los puntos se disponen cronológicamente (por índice de estudio en la serie).
 * - Solo se conectan puntos numéricos adyacentes con unidades compatibles
 *   y sin datos faltantes entre medio (no se interpola sobre huecos).
 * - La dirección general se deriva de comparar el primer y último valor
 *   numérico; no implica que el valor sea "mejor" o "peor".
 * - La dirección se comunica con símbolo + texto (no solo con color).
 */

import type { ParameterTrack, PointValue } from "./types.ts";
import { parseNumericValue } from "./build-series.ts";
import { formatValueWithUnit } from "../comparison/presentation.ts";

// Re-export para consistencia con el resto de la evolución.
export { parseNumericValue };

/** Dirección objetiva general (primer → último valor numérico). */
export type SparklineDirection = "increased" | "decreased" | "stable";

/** Punto numérico de un parámetro, con su posición en la serie. */
export type SparklinePoint = {
  /** ID del estudio (trazabilidad). */
  studyId: string;
  /** Índice del estudio dentro de la serie (0..studyCount-1). */
  studyIndex: number;
  /** Índice dentro de track.points (para detectar puntos intermedios no numéricos). */
  trackIndex: number;
  /** Valor numérico (garantizado no-null). */
  value: number;
  /** Valor crudo tal como viene del análisis. */
  rawValue: string;
  /** Unidad en este punto (puede variar entre puntos). */
  unit: string | null | undefined;
  /** Fecha del estudio (created_at). */
  date: string;
  /** Status del parámetro en este punto. */
  status: PointValue["status"];
};

/** Resumen textual objetivo del sparkline (para accesibilidad y UI). */
export type SparklineSummary = {
  /** Cantidad de puntos numéricos graficados. */
  numericCount: number;
  /** Valores formateados ("12 mg/dL") en orden cronológico. */
  values: string[];
  /** Primer valor formateado. */
  firstValue: string;
  /** Último valor formateado. */
  lastValue: string;
  /** Unidad representativa del track (puede variar; la del primer punto con unidad). */
  unit: string | null | undefined;
  /** Dirección general objetivo (primer → último). */
  direction: SparklineDirection;
};

/** Razón por la que un parámetro no se grafica. */
export type SparklineNotRenderableReason =
  | "no_numeric_points"
  | "less_than_three_points";

/** Modelo de sparkline: o bien no se grafica, o bien hay datos para dibujar. */
export type SparklineModel =
  | { kind: "no_render"; reason: SparklineNotRenderableReason }
  | {
      kind: "render";
      /** Todos los puntos numéricos, en orden cronológico. */
      points: SparklinePoint[];
      /** Tramos de puntos conectables (tramo con 1 punto = solo su marcador). */
      segments: SparklinePoint[][];
      /** Valor mínimo entre los puntos numéricos. */
      minValue: number;
      /** Valor máximo entre los puntos numéricos. */
      maxValue: number;
      /** true si todos los valores son idénticos (línea estable). */
      flat: boolean;
      /** Cantidad de estudios de la serie (para escalar el eje x). */
      studyCount: number;
      /** Resumen textual objetivo. */
      summary: SparklineSummary;
    };

/** Umbral mínimo de puntos numéricos para graficar. */
export const SPARKLINE_MIN_POINTS = 3;

/**
 * Unidades compatibles para conectar dos puntos.
 * Mismo criterio que el motor 10.4: null y undefined significan "sin unidad"
 * y son equivalentes; cualquier otra diferencia rompe la conexión.
 */
function unitsCompatible(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  return (a ?? undefined) === (b ?? undefined);
}

/**
 * Construye el modelo de sparkline a partir de un track de parámetro y la
 * lista de IDs de estudios de la serie (orden cronológico ASC).
 *
 * Reglas:
 * - Filtra solo puntos numéricos.
 * - < SPARKLINE_MIN_POINTS puntos numéricos → no_render.
 * - Agrupa en tramos conectables: dos puntos consecutivos se conectan solo si
 *   son adyacentes en el track, adyacentes en la serie (sin estudio faltante)
 *   y con unidades compatibles.
 * - La dirección es objetivo (primer vs último valor); no interpreta clínica.
 */
export function buildSparklineModel(
  track: ParameterTrack,
  studyIds: string[],
): SparklineModel {
  const studyIndex = new Map<string, number>(
    studyIds.map((id, i) => [id, i]),
  );

  const points: SparklinePoint[] = [];
  track.points.forEach((p: PointValue, trackIndex) => {
    if (p.numericValue === null) return; // no numérico: no se grafica
    const idx = studyIndex.get(p.studyId);
    if (idx === undefined) return; // defensivo: punto fuera de la serie
    points.push({
      studyId: p.studyId,
      studyIndex: idx,
      trackIndex,
      value: p.numericValue,
      rawValue: p.value,
      unit: p.unit,
      date: p.date,
      status: p.status,
    });
  });

  if (points.length === 0) {
    return { kind: "no_render", reason: "no_numeric_points" };
  }
  if (points.length < SPARKLINE_MIN_POINTS) {
    return { kind: "no_render", reason: "less_than_three_points" };
  }

  // Tramos de puntos conectables.
  const segments: SparklinePoint[][] = [];
  let current: SparklinePoint[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const connected =
      prev.trackIndex + 1 === cur.trackIndex && // sin punto no numérico intermedio
      cur.studyIndex === prev.studyIndex + 1 && // sin estudio faltante (hueco)
      unitsCompatible(prev.unit, cur.unit); // unidades compatibles
    if (connected) {
      current.push(cur);
    } else {
      segments.push(current);
      current = [cur];
    }
  }
  segments.push(current);

  const values = points.map((p) => p.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const flat = minValue === maxValue;

  const first = points[0];
  const last = points[points.length - 1];
  const direction: SparklineDirection =
    last.value > first.value
      ? "increased"
      : last.value < first.value
        ? "decreased"
        : "stable";

  const summary: SparklineSummary = {
    numericCount: points.length,
    values: points.map((p) => formatValueWithUnit(p.rawValue, p.unit)),
    firstValue: formatValueWithUnit(first.rawValue, first.unit),
    lastValue: formatValueWithUnit(last.rawValue, last.unit),
    unit: track.unit,
    direction,
  };

  return {
    kind: "render",
    points,
    segments,
    minValue,
    maxValue,
    flat,
    studyCount: studyIds.length,
    summary,
  };
}

// ── Coordenadas SVG ──────────────────────────────────────────────────────

export type SparklineLayoutPoint = {
  x: number;
  y: number;
  studyId: string;
  value: string;
};

export type SparklineLayout = {
  viewBox: string;
  /** Marcadores (círculos) por punto numérico. */
  points: SparklineLayoutPoint[];
  /** Polilíneas por tramo con >= 2 puntos ("x1,y1 x2,y2 …"). */
  polylines: { points: string }[];
};

const H_PADDING = 10;
const V_PADDING = 8;

/**
 * Calcula las coordenadas SVG del modelo (viewBox, marcadores y polilíneas).
 * Devuelve null si el modelo no es graficable.
 *
 * Escala x: por índice de estudio sobre studyCount (los huecos se ven como
 * separación horizontal). Escala y: lineal sobre [minValue, maxValue]; si
 * todos los valores son iguales (flat), devuelve una línea estable centrada
 * para evitar la división por cero.
 */
export function computeSparklineLayout(
  model: SparklineModel,
  width = 200,
  height = 52,
): SparklineLayout | null {
  if (model.kind === "no_render") return null;

  const { points, segments, minValue, maxValue, flat, studyCount } = model;

  const innerW = width - 2 * H_PADDING;
  const innerH = height - 2 * V_PADDING;

  const xFor = (index: number): number => {
    if (studyCount <= 1) return width / 2;
    return H_PADDING + (index / (studyCount - 1)) * innerW;
  };

  const yFor = (value: number): number => {
    if (flat) return height / 2; // línea estable: evita división por cero
    const span = maxValue - minValue;
    return V_PADDING + (1 - (value - minValue) / span) * innerH;
  };

  const layoutPoints: SparklineLayoutPoint[] = points.map((p) => ({
    x: xFor(p.studyIndex),
    y: yFor(p.value),
    studyId: p.studyId,
    value: formatValueWithUnit(p.rawValue, p.unit),
  }));

  const polylines: { points: string }[] = [];
  for (const seg of segments) {
    if (seg.length < 2) continue;
    const pts = seg
      .map((p) => `${xFor(p.studyIndex)},${yFor(p.value)}`)
      .join(" ");
    polylines.push({ points: pts });
  }

  return {
    viewBox: `0 0 ${width} ${height}`,
    points: layoutPoints,
    polylines,
  };
}

// ── Texto objetivo / accesible ───────────────────────────────────────────

/** Texto legible de la dirección general (objetivo, sin interpretación). */
export function sparklineDirectionLabel(model: SparklineModel): string {
  if (model.kind !== "render") return "";
  switch (model.summary.direction) {
    case "increased": return "Ascendente";
    case "decreased": return "Descendente";
    case "stable": return "Estable";
  }
}

/** Símbolo corto de la dirección (consistente con la tabla 10.5). */
export function sparklineDirectionSymbol(model: SparklineModel): string {
  if (model.kind !== "render") return "";
  switch (model.summary.direction) {
    case "increased": return "↑";
    case "decreased": return "↓";
    case "stable": return "·";
  }
}

/**
 * Resumen textual completo del sparkline para accesibilidad (aria-label/title)
 * y lectura objetiva. Ej.: "Valores: 12, 13, 11 mg/dL · tendencia descendente".
 */
export function sparklineSummaryText(model: SparklineModel): string {
  if (model.kind !== "render") return "";
  const { summary } = model;
  const dir =
    summary.direction === "increased"
      ? "tendencia ascendente"
      : summary.direction === "decreased"
        ? "tendencia descendente"
        : "tendencia estable";
  return `Valores: ${summary.values.join(", ")} · ${dir}`;
}
