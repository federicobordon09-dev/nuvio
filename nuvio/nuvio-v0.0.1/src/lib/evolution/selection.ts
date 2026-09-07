/**
 * Fase 10.3 — Selección de serie longitudinal.
 *
 * Lógica pura de selección de una serie de estudios del mismo tipo
 * (máximo 10), independiente de `comparison/` y de cualquier UI.
 *
 * Decisión de orden:
 * - Los badges A→B→C… siguen el ORDEN DE CLICK (estable y predecible).
 * - La serie final (URL) se ordena por `created_at ASC`, sin importar
 *   el orden de clicks. Esa es la semántica temporal de la evolución.
 *
 * La validación `validateEvolutionSeries` es la utilidad reutilizable
 * para el servidor (Fase 10.5): pura, separada de UI. El ownership de
 * cada ID debe validarse en servidor al leer la URL; acá no se conoce.
 */

import type { StudyType } from "../studies-utils.ts";
import {
  isEvolutionReady,
  buildEvolutionUrl,
} from "../studies/history.ts";

export const EVOLUTION_MIN_STUDIES = 2;
export const EVOLUTION_MAX_STUDIES = 10;

/** Letras de posición A–J para los badges de la serie. */
export const SERIES_LETTERS = "ABCDEFGHIJ";

/** Fila mínima necesaria para decidir selección y validez de una serie. */
export type EvolutionStudy = {
  id: string;
  study_type: StudyType | null;
  status: string;
  analysis_status: string;
  created_at: string;
};

/** Estado de selección de serie (una sola familia activa a la vez). */
export type EvolutionSeriesState = {
  /** study_type de la familia activa; null = sin familia activa. */
  studyType: StudyType | null;
  /** IDs en orden de click; punto de verdad para badges y contador. */
  selectedIds: string[];
};

/** Estado inicial vacío. */
export const initialEvolutionSeriesState: EvolutionSeriesState = {
  studyType: null,
  selectedIds: [],
};

// ── Motivos de serie inválida (para UI y servidor) ────────

export type SeriesInvalidReason =
  | "not_enough_studies"
  | "too_many_studies"
  | "missing_study_type"
  | "mixed_study_type"
  | "not_ready";

export type SeriesValidation = {
  valid: boolean;
  reason: SeriesInvalidReason | null;
  studyType: StudyType | null;
  count: number;
};

// ── Construcción del estado ───────────────────────────────

/** Arma la selección en una familia, descartando cualquier selección previa. */
export function beginEvolutionSeries(
  studyType: StudyType,
): EvolutionSeriesState {
  return { studyType, selectedIds: [] };
}

/** Vacía la selección por completo. */
export function clearEvolutionSeries(): EvolutionSeriesState {
  return initialEvolutionSeriesState;
}

// ── Operaciones de selección ──────────────────────────────

/**
 * Intenta agregar un estudio a la serie (máx 10).
 * No-op si: no hay familia activa, el estudio no es de esa familia,
 * no tiene study_type, no está ready, ya está seleccionado, o se alcanzó
 * el límite de 10.
 */
export function addEvolutionStudy(
  state: EvolutionSeriesState,
  study: EvolutionStudy,
): EvolutionSeriesState {
  if (state.studyType === null) return state; // sin familia activa
  if (study.study_type !== state.studyType) return state; // mezcla de tipos
  if (study.study_type === null) return state; // sin tipo definido
  if (!isEvolutionReady(study.status, study.analysis_status)) return state; // no apto
  if (state.selectedIds.includes(study.id)) return state; // duplicado
  if (state.selectedIds.length >= EVOLUTION_MAX_STUDIES) return state; // límite
  return {
    ...state,
    selectedIds: [...state.selectedIds, study.id],
  };
}

/** Quita un estudio de la serie. */
export function removeEvolutionStudy(
  state: EvolutionSeriesState,
  id: string,
): EvolutionSeriesState {
  return {
    ...state,
    selectedIds: state.selectedIds.filter((s) => s !== id),
  };
}

/** Alterna la presencia de un estudio en la serie. */
export function toggleEvolutionStudy(
  state: EvolutionSeriesState,
  study: EvolutionStudy,
): EvolutionSeriesState {
  if (state.selectedIds.includes(study.id)) {
    return removeEvolutionStudy(state, study.id);
  }
  return addEvolutionStudy(state, study);
}

// ── Consultas de estado ───────────────────────────────────

/** Verifica si un estudio específico está seleccionado. */
export function isInEvolutionSeries(
  state: EvolutionSeriesState,
  id: string,
): boolean {
  return state.selectedIds.includes(id);
}

/** Cantidad de estudios seleccionados. */
export function countEvolutionSeries(state: EvolutionSeriesState): number {
  return state.selectedIds.length;
}

/** true si la serie alcanzó el máximo de 10. */
export function isEvolutionSeriesFull(
  state: EvolutionSeriesState,
): boolean {
  return state.selectedIds.length >= EVOLUTION_MAX_STUDIES;
}

/**
 * Índice de badge según el orden de click (0 = A, 9 = J), o -1
 * si el estudio no está seleccionado. El índice es estable: no cambia
 * al agregar/quitar otros estudios.
 */
export function getEvolutionBadgeIndex(
  state: EvolutionSeriesState,
  id: string,
): number {
  return state.selectedIds.indexOf(id);
}

/** Letra del badge (A–J) o null si el estudio no está en la serie. */
export function getEvolutionBadgeLabel(
  state: EvolutionSeriesState,
  id: string,
): string | null {
  const idx = getEvolutionBadgeIndex(state, id);
  return idx >= 0 ? SERIES_LETTERS[idx] : null;
}

// ── Validación y URL ──────────────────────────────────────

/**
 * Valida una serie completa de estudios. Es la utilidad reutilizable
 * para el servidor (Fase 10.5). Requiere:
 * 2–10 estudios, study_type definido en todos, tipo homogéneo,
 * todos ready (status=processed + analysis_status=completed).
 *
 * El orden del motivo es determinista.
 */
export function validateEvolutionSeries(
  studies: EvolutionStudy[],
): SeriesValidation {
  if (studies.length < EVOLUTION_MIN_STUDIES) {
    return { valid: false, reason: "not_enough_studies", studyType: null, count: studies.length };
  }
  if (studies.length > EVOLUTION_MAX_STUDIES) {
    return { valid: false, reason: "too_many_studies", studyType: null, count: studies.length };
  }
  if (studies.some((s) => s.study_type === null)) {
    return { valid: false, reason: "missing_study_type", studyType: null, count: studies.length };
  }
  const first = studies[0];
  if (studies.some((s) => s.study_type !== first.study_type)) {
    return { valid: false, reason: "mixed_study_type", studyType: null, count: studies.length };
  }
  if (studies.some((s) => !isEvolutionReady(s.status, s.analysis_status))) {
    return { valid: false, reason: "not_ready", studyType: first.study_type, count: studies.length };
  }
  return { valid: true, reason: null, studyType: first.study_type, count: studies.length };
}

/** Resuelve los IDs seleccionados a filas usando la lista disponible. */
function resolveSelected(
  state: EvolutionSeriesState,
  available: EvolutionStudy[],
): EvolutionStudy[] {
  return state.selectedIds
    .map((id) => available.find((s) => s.id === id))
    .filter((s): s is EvolutionStudy => Boolean(s));
}

/**
 * true si la selección actual forma una serie válida (2–10, todos
 * ready, mismo tipo definido). Si algún ID no se resuelve en
 * `available`, la serie se considera inválida.
 */
export function canRunEvolution(
  state: EvolutionSeriesState,
  available: EvolutionStudy[],
): boolean {
  if (state.studyType === null) return false;
  return validateEvolutionSeries(resolveSelected(state, available)).valid;
}

/**
 * URL de la serie con los IDs en orden cronológico ASC.
 * null si la serie no es válida o algún ID no se resuelve.
 */
export function getEvolutionUrl(
  state: EvolutionSeriesState,
  available: EvolutionStudy[],
): string | null {
  if (!canRunEvolution(state, available)) return null;
  const ordered = [...resolveSelected(state, available)].sort((a, b) =>
    a.created_at < b.created_at
      ? -1
      : a.created_at > b.created_at
        ? 1
        : 0,
  );
  return buildEvolutionUrl(ordered.map((s) => s.id));
}

// ── Etiquetas de UI ───────────────────────────────────────

/** Etiqueta accesible del contador (ej. "3 de 10"). */
export function getEvolutionCountLabel(
  state: EvolutionSeriesState,
): string {
  return `${countEvolutionSeries(state)} de ${EVOLUTION_MAX_STUDIES}`;
}

/** Etiqueta del botón principal de serie. */
export function getEvolutionCtaLabel(
  state: EvolutionSeriesState,
  available: EvolutionStudy[],
): string {
  if (canRunEvolution(state, available)) return "Ver evolución";
  return countEvolutionSeries(state) === 0
    ? "Seleccioná estudios"
    : "Seleccioná 2 o más";
}