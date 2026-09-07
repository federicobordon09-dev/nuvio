/**
 * Fase 9.4 — Lógica pura de presentación de comparación.
 *
 * Funciones y constantes usadas por los componentes de UI.
 * Sin dependencias React ni de framework; testeable unitariamente.
 * Toda la información proviene del resultado de compareStudies().
 */

import type { MeasurementStatus, FindingStatus } from "../analysis/schema.ts";
import type {
  ComparisonResult,
  MeasurementComparable,
  ValueDiff,
} from "./types.ts";

// ── Tipos de presentación ──────────────────────────────────────────────

/** Estudio resumido para la sección de contexto. */
export type ComparisonStudy = {
  id: string;
  file_name: string;
  created_at: string;
  study_type: string | null;
  file_size: number;
};

/** Clasificación de cambio numérico. */
export type ChangeKind =
  | "increased"
  | "decreased"
  | "stable"
  | "non_numeric"
  | "incompatible";

/** Tile del resumen visual. */
export type ComparisonTile = {
  key: string;
  label: string;
  value: number;
  tone: string;
};

// ── Valor + unidad ─────────────────────────────────────────────────────

export function formatValueWithUnit(
  value: string | undefined,
  unit: string | null | undefined
): string {
  const v = value ?? "";
  if (v.length === 0) return "—";
  const u = unit ?? "";
  return u.length > 0 ? `${v} ${u}` : v;
}

export function formatReferenceRange(
  range: string | null | undefined
): string | null {
  if (!range || range.trim().length === 0) return null;
  return range;
}

// ── Formateo numérico ──────────────────────────────────────────────────

export function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/** Delta absoluto entre valores numéricos. */
export function formatDelta(diff: MeasurementComparable): string | null {
  if (diff.valueDiff.kind !== "both_numeric") return null;
  return formatNumber(diff.valueDiff.absoluteDifference);
}

/** Variación porcentual. null cuando previousValue era 0. */
export function formatPercentageChange(diff: MeasurementComparable): string | null {
  if (diff.valueDiff.kind !== "both_numeric") return null;
  const pct = diff.valueDiff.percentageChange;
  if (pct === null) return null;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${formatNumber(pct)}%`;
}

// ── Clasificación de cambio ────────────────────────────────────────────

export function changeKind(diff: MeasurementComparable): ChangeKind {
  const vd: ValueDiff = diff.valueDiff;
  switch (vd.kind) {
    case "not_comparable":
      return "incompatible";
    case "both_numeric":
      return vd.direction; // "increased" | "decreased" | "stable"
    default:
      return "non_numeric";
  }
}

export const CHANGE_LABELS: Record<ChangeKind, string> = {
  increased: "Aumentó",
  decreased: "Disminuyó",
  stable: "Estable",
  non_numeric: "Sin comparación numérica",
  incompatible: "No comparable",
};

export const CHANGE_BADGE_TONES: Record<ChangeKind, string> = {
  increased: "bg-warning-tint text-warning-strong",
  decreased: "bg-info-tint text-info",
  stable: "bg-muted text-muted-foreground",
  non_numeric: "bg-muted text-muted-foreground",
  incompatible: "bg-warning-tint text-warning-strong",
};

export const CHANGE_ICONS: Record<ChangeKind, string> = {
  increased: "↑",
  decreased: "↓",
  stable: "·",
  non_numeric: "⊘",
  incompatible: "⊘",
};

/**
 * Nota de comparación numérica para la fila de detalle.
 * Devuelve texto explicativo o null si los valores son ambos numéricos.
 */
export function numericComparisonNote(
  diff: MeasurementComparable
): string | null {
  switch (diff.valueDiff.kind) {
    case "not_comparable":
      return diff.valueDiff.reason;
    case "one_numeric":
      return "Uno de los valores no es numérico; no se comparan numéricamente.";
    case "both_non_numeric":
      return "Ambos valores no son numéricos.";
    default:
      return null;
  }
}

// ── Estado de medición ─────────────────────────────────────────────────

export const MEASUREMENT_STATUS_LABELS: Record<MeasurementStatus, string> = {
  within_range: "Dentro del rango",
  above_range: "Por encima del rango",
  below_range: "Por debajo del rango",
  abnormal: "Anormal",
  unknown: "Sin determinar",
  no_reference: "Sin referencia",
};

export const MEASUREMENT_STATUS_TONES: Record<MeasurementStatus, string> = {
  within_range: "bg-success-tint text-success-strong",
  above_range: "bg-warning-tint text-warning-strong",
  below_range: "bg-warning-tint text-warning-strong",
  abnormal: "bg-danger-tint text-danger-strong",
  unknown: "bg-muted text-muted-foreground",
  no_reference: "bg-muted text-muted-foreground",
};

// ── Importancia de hallazgos ───────────────────────────────────────────

export const IMPORTANCE_LABELS: Record<FindingStatus, string> = {
  normal: "Normal",
  high: "Alto",
  low: "Bajo",
  abnormal: "Anormal",
  unknown: "Desconocido",
};

export function importanceLabel(status: FindingStatus | undefined): string {
  if (status === undefined || status === null) return "Sin especificar";
  return IMPORTANCE_LABELS[status] ?? status;
}

export const IMPORTANCE_TONES: Record<FindingStatus, string> = {
  normal: "bg-success-tint text-success-strong",
  high: "bg-danger-tint text-danger-strong",
  low: "bg-info-tint text-info",
  abnormal: "bg-warning-tint text-warning-strong",
  unknown: "bg-muted text-muted-foreground",
};

// ── Resumen visual de contadores ───────────────────────────────────────

/** Tiles para la sección "Resumen de cambios". */
export function computeComparisonTiles(
  result: Extract<ComparisonResult, { comparable: true }>
): ComparisonTile[] {
  const { overall, keyFindingDiffs } = result;
  let modifiedFindings = 0;
  for (const diff of keyFindingDiffs) {
    if (diff.status === "comparable" && diff.importanceChanged) {
      modifiedFindings++;
    }
  }

  return [
    {
      key: "compared",
      label: "Mediciones comparadas",
      value: overall.numericSummary.comparableCount,
      tone: "bg-ocean-tint text-ocean",
    },
    {
      key: "increased",
      label: "Subieron",
      value: overall.numericSummary.increasedCount,
      tone: "bg-warning-tint text-warning-strong",
    },
    {
      key: "decreased",
      label: "Bajaron",
      value: overall.numericSummary.decreasedCount,
      tone: "bg-info-tint text-info",
    },
    {
      key: "stable",
      label: "Estables",
      value: overall.numericSummary.stableCount,
      tone: "bg-muted text-muted-foreground",
    },
    {
      key: "new",
      label: "Parámetros nuevos",
      value: overall.newParametersCount,
      tone: "bg-ocean-tint text-ocean",
    },
    {
      key: "missing",
      label: "Parámetros ausentes",
      value: overall.missingParametersCount,
      tone: "bg-warning-tint text-warning-strong",
    },
    {
      key: "non_numeric",
      label: "Sin comparación numérica",
      value: overall.numericSummary.notComparableCount,
      tone: "bg-muted text-muted-foreground",
    },
    {
      key: "new_findings",
      label: "Hallazgos nuevos",
      value: overall.newFindingsCount,
      tone: "bg-ocean-tint text-ocean",
    },
    {
      key: "missing_findings",
      label: "Hallazgos ausentes",
      value: overall.missingFindingsCount,
      tone: "bg-warning-tint text-warning-strong",
    },
    {
      key: "modified_findings",
      label: "Hallazgos con cambio de importancia",
      value: modifiedFindings,
      tone: "bg-warning-tint text-warning-strong",
    },
  ];
}
