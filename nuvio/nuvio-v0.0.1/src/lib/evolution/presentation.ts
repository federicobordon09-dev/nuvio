/**
 * Fase 10.5 — Lógica pura de presentación de evolución longitudinal.
 *
 * Funciones y constantes usadas por los componentes de UI de la evolución.
 * Sin dependencias React ni de framework; testeable unitariamente.
 * Toda la información proviene del resultado de buildEvolutionSeries().
 *
 * La presentación es estrictamente técnica y objetiva:
 * no interpreta clínicamente, no opina sobre si la evolución es "mejor" o
 * "peor", y no expone detalles internos del backend en los errores.
 */

import {
  getStudyTypeLabelNullable,
  type StudyType,
} from "../studies-utils.ts";
import { formatNumber } from "../comparison/presentation.ts";
import type {
  SeriesIncompatibility,
  ValueChange,
  EvolutionOverall,
} from "./types.ts";

// Re-export del label de tipo de estudio (evita duplicar el mapping).
export { getStudyTypeLabelNullable };

// ── Tipo de contexto de la serie (para los componentes de UI) ────────────

/** Estudio resumido para las tarjetas de contexto y la cabecera de la tabla. */
export type EvolutionContextStudy = {
  id: string;
  file_name: string;
  created_at: string;
  study_type: StudyType | null;
};

// ── Fechas ──────────────────────────────────────────────────────────────

/** Fecha larga legible (ej. "3 de septiembre de 2026"). Vacío si es inválida. */
export function formatLongDate(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("es-AR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/** Fecha corta para columnas (ej. "03 sep 26"). Vacío si es inválida. */
export function formatShortDate(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  } catch {
    return "";
  }
}

/** Rango "desde → hasta" de la serie (los estudios llegan ordenados ASC). */
export function getSeriesDateRangeLabel(
  studies: { created_at: string }[],
): string {
  if (studies.length === 0) return "";
  const from = formatShortDate(studies[0].created_at);
  if (studies.length === 1) return from;
  const to = formatShortDate(studies[studies.length - 1].created_at);
  return `${from} → ${to}`;
}

// ── Mensajes de incompatibilidad ────────────────────────────────────────

/**
 * Mensajes humanos por tipo de incompatibilidad del motor de evolución.
 * El motor produce un `detail` técnico; aquí se mapea el `kind` a un
 * mensaje legible, sin exponer slugs, IDs ni detalles internos.
 */
export const SERIES_INCOMPATIBILITY_MESSAGES: Record<
  SeriesIncompatibility["kind"],
  string
> = {
  empty_series: "No hay estudios para analizar la evolución.",
  not_enough_studies:
    "Se necesitan al menos dos estudios para ver una evolución.",
  too_many_studies:
    "La serie supera el máximo de estudios permitidos (10).",
  mixed_study_type:
    "Los estudios seleccionados son de tipos diferentes y no pueden agruparse como una sola evolución.",
  missing_analysis:
    "Uno de los estudios no tiene un análisis completo que podamos leer.",
  not_chronological:
    "Los estudios no están en orden cronológico. El sistema los ordena automáticamente al construir la evolución.",
};

export function getSeriesIncompatibilityMessage(
  kind: SeriesIncompatibility["kind"],
): string {
  return SERIES_INCOMPATIBILITY_MESSAGES[kind];
}

// ── Clasificación de cambio entre puntos ────────────────────────────────

/**
 * Símbolo corto de cambio para píldoras de tabla.
 * Reutiliza la semántica visual de la comparación: ↑ aumentó, ↓ disminuyó,
 * · estable, ⊘ no comparable numéricamente.
 */
export function changeSymbol(change: ValueChange): string {
  switch (change.kind) {
    case "both_numeric":
      return change.direction === "increased"
        ? "↑"
        : change.direction === "decreased"
          ? "↓"
          : "·";
    default:
      return "⊘";
  }
}

/** Etiqueta corta del cambio, sin interpretación clínica. */
export function changeLabel(change: ValueChange): string {
  switch (change.kind) {
    case "both_numeric":
      return change.direction === "increased"
        ? "Aumentó"
        : change.direction === "decreased"
          ? "Disminuyó"
          : "Estable";
    case "one_numeric":
      return "Uno de los valores no es numérico";
    case "both_non_numeric":
      return "Ambos valores no son numéricos";
    case "not_comparable":
      return "No comparable";
  }
}

/** Tono de la píldora del cambio. */
export function changeTone(change: ValueChange): string {
  switch (change.kind) {
    case "both_numeric":
      return change.direction === "increased"
        ? "bg-warning-tint text-warning-strong"
        : change.direction === "decreased"
          ? "bg-info-tint text-info"
          : "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

/**
 * Delta absoluto con signo según la dirección ("+15" / "-15").
 * Para cambios estables no se antepone signo. null si no es numérico.
 */
export function formatChangeDelta(
  change: ValueChange,
): string | null {
  if (change.kind !== "both_numeric") return null;
  const { absoluteDifference, direction } = change;
  if (direction === "stable") return formatNumber(absoluteDifference);
  const sign = direction === "increased" ? "+" : "-";
  return `${sign}${formatNumber(absoluteDifference)}`;
}

/** Variación porcentual con signo. null cuando no aplica o base era 0. */
export function formatChangePercent(
  change: ValueChange,
): string | null {
  if (change.kind !== "both_numeric") return null;
  const pct = change.percentageChange;
  if (pct === null) return null;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${formatNumber(pct)}%`;
}

// ── Resumen visual de contadores (tiles violeta) ─────────────────────────

/** Tile del resumen de evolución. */
export type EvolutionTile = {
  key: string;
  label: string;
  value: number;
  tone: string;
  /** "primary" = "qué cambió" (dominante); "secondary" = detalle. */
  group: "primary" | "secondary";
};

/**
 * Tiles para la sección "Resumen de la evolución".
 *
 * - primary: Cambios, Aumentaron, Disminuyeron, Sin cambios.
 * - secondary: cantidad de parámetros (únicos, persistentes, transitorios)
 *   y cambios sin comparación numérica.
 */
export function computeEvolutionTiles(
  overall: EvolutionOverall,
): EvolutionTile[] {
  return [
    {
      key: "changes",
      label: "Cambios",
      value: overall.numericChanges,
      tone: "bg-violet text-white",
      group: "primary",
    },
    {
      key: "increased",
      label: "Aumentaron",
      value: overall.increased,
      tone: "bg-warning-tint text-warning-strong",
      group: "primary",
    },
    {
      key: "decreased",
      label: "Disminuyeron",
      value: overall.decreased,
      tone: "bg-info-tint text-info",
      group: "primary",
    },
    {
      key: "stable",
      label: "Sin cambios",
      value: overall.stable,
      tone: "bg-muted text-muted-foreground",
      group: "primary",
    },
    {
      key: "parameters",
      label: "Parámetros vistos",
      value: overall.uniqueParameters,
      tone: "bg-violet-tint text-violet",
      group: "secondary",
    },
    {
      key: "persistent",
      label: "En todos los estudios",
      value: overall.persistentParameters,
      tone: "bg-violet-tint text-violet",
      group: "secondary",
    },
    {
      key: "transient",
      label: "En algunos estudios",
      value: overall.transientParameters,
      tone: "bg-warning-tint text-warning-strong",
      group: "secondary",
    },
    {
      key: "not_comparable",
      label: "Sin comparación numérica",
      value: overall.notComparableChanges,
      tone: "bg-muted text-muted-foreground",
      group: "secondary",
    },
  ];
}