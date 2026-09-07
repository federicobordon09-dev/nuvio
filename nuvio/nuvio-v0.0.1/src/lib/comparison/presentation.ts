/**
 * Fase 9.4 — Lógica pura de presentación de comparación.
 *
 * Funciones y constantes usadas por los componentes de UI.
 * Sin dependencias React ni de framework; testeable unitariamente.
 * Toda la información proviene del resultado de compareStudies().
 */

import type { MeasurementStatus, FindingStatus } from "../analysis/schema.ts";
import { getStudyTypeLabelNullable } from "../studies-utils.ts";
import type {
  ComparisonIncompatibility,
  ComparisonResult,
  MeasurementComparable,
  ValueDiff,
} from "./types.ts";

// Re-export del label de tipo de estudio (evita duplicar el mapping).
export { getStudyTypeLabelNullable };

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
  /** "primary" = "qué cambió" (dominante); "secondary" = detalle (subordinado). */
  group: "primary" | "secondary";
};

// ── Mensajes de incompatibilidad ────────────────────────────────────────

/**
 * Mensajes humanos por tipo de incompatibilidad.
 * El motor (compare-studies) produce un `detail` técnico; aquí se mapea el
 * `kind` a un mensaje legible, sin exponer slugs, analysis_status ni detalles
 * internos del backend.
 */
export const INCOMPATIBILITY_MESSAGES: Record<
  ComparisonIncompatibility["kind"],
  string
> = {
  not_completed:
    "Uno de los estudios todavía no está listo para compararse.",
  missing_study_type:
    "No pudimos identificar el tipo de uno de los estudios.",
  different_study_type:
    "Estos estudios son de tipos diferentes y no pueden compararse entre sí.",
  empty_analysis:
    "No hay suficiente información analizada para realizar esta comparación.",
};

export function getIncompatibilityMessage(
  kind: ComparisonIncompatibility["kind"]
): string {
  return INCOMPATIBILITY_MESSAGES[kind];
}

/**
 * Nota humana para una medición cuyas unidades no coinciden.
 * Sustituye el motivo técnico del motor ("...la conversión no está
 * implementada") por una explicación legible para el usuario final.
 */
export const UNIT_MISMATCH_NOTE =
  "Los valores usan unidades distintas y no pueden compararse numéricamente.";

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

/**
 * Delta absoluto con signo según la dirección ("+15" / "-15").
 * Para cambios estables no se antepone signo.
 */
export function formatSignedDelta(diff: MeasurementComparable): string | null {
  if (diff.valueDiff.kind !== "both_numeric") return null;
  const { absoluteDifference, direction } = diff.valueDiff;
  if (direction === "stable") return formatNumber(absoluteDifference);
  const sign = direction === "increased" ? "+" : "-";
  return `${sign}${formatNumber(absoluteDifference)}`;
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
  non_numeric: "Sin valor numérico para comparar",
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

/**
 * Tiles para la sección "Resumen de cambios".
 *
 * Jerarquía visual (Fase 9.6):
 * - primary: "¿Qué cambió?" — Cambios, Aumentaron, Disminuyeron, Sin cambios.
 * - secondary: "¿Cuánto detalle hay?" — parámetros/hallazgos nuevos/ausentes,
 *   sin comparación numérica, cambios de importancia. Se muestran subordinados.
 */
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

  const changesCount =
    overall.numericSummary.increasedCount +
    overall.numericSummary.decreasedCount;

  return [
    {
      key: "changes",
      label: "Cambios",
      value: changesCount,
      tone: "bg-ocean text-white",
      group: "primary",
    },
    {
      key: "increased",
      label: "Aumentaron",
      value: overall.numericSummary.increasedCount,
      tone: "bg-warning-tint text-warning-strong",
      group: "primary",
    },
    {
      key: "decreased",
      label: "Disminuyeron",
      value: overall.numericSummary.decreasedCount,
      tone: "bg-info-tint text-info",
      group: "primary",
    },
    {
      key: "stable",
      label: "Sin cambios",
      value: overall.numericSummary.stableCount,
      tone: "bg-muted text-muted-foreground",
      group: "primary",
    },
    {
      key: "compared",
      label: "Mediciones comparadas",
      value: overall.numericSummary.comparableCount,
      tone: "bg-ocean-tint text-ocean",
      group: "secondary",
    },
    {
      key: "new",
      label: "Parámetros nuevos",
      value: overall.newParametersCount,
      tone: "bg-ocean-tint text-ocean",
      group: "secondary",
    },
    {
      key: "missing",
      label: "Parámetros ausentes",
      value: overall.missingParametersCount,
      tone: "bg-warning-tint text-warning-strong",
      group: "secondary",
    },
    {
      key: "non_numeric",
      label: "Valores sin comparación numérica",
      value: overall.numericSummary.notComparableCount,
      tone: "bg-muted text-muted-foreground",
      group: "secondary",
    },
    {
      key: "new_findings",
      label: "Hallazgos nuevos",
      value: overall.newFindingsCount,
      tone: "bg-ocean-tint text-ocean",
      group: "secondary",
    },
    {
      key: "missing_findings",
      label: "Hallazgos ausentes",
      value: overall.missingFindingsCount,
      tone: "bg-warning-tint text-warning-strong",
      group: "secondary",
    },
    {
      key: "modified_findings",
      label: "Cambios de importancia",
      value: modifiedFindings,
      tone: "bg-warning-tint text-warning-strong",
      group: "secondary",
    },
  ];
}
