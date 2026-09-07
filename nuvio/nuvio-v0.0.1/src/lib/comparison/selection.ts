/**
 * Fase 9.5 — Lógica pura de selección de estudios para comparación.
 *
 * Funciones testeables sin React ni framework.
 * Gestiona un máximo de 2 selecciones; orden determinista = orden de selección.
 */

import type { StudyType } from "@/lib/studies-utils";

export type StudyForSelection = {
  id: string;
  file_name: string;
  study_type: StudyType | null;
  status: string;
  analysis_status: string;
  file_size: number;
  created_at: string;
};

export type SelectionState = {
  selectedIds: string[];
  /** ID del estudio que se acaba de seleccionar (para animaciones/feedback). */
  lastAddedId: string | null;
};

/** Estado inicial vacío. */
export const initialSelectionState: SelectionState = {
  selectedIds: [],
  lastAddedId: null,
};

/** Intenta agregar un ID a la selección (máx 2). */
export function addSelection(
  state: SelectionState,
  id: string
): SelectionState {
  if (state.selectedIds.includes(id)) {
    return state; // ya seleccionado → no-op
  }
  if (state.selectedIds.length >= 2) {
    return state; // límite alcanzado
  }
  return {
    selectedIds: [...state.selectedIds, id],
    lastAddedId: id,
  };
}

/** Quita un ID de la selección. */
export function removeSelection(
  state: SelectionState,
  id: string
): SelectionState {
  return {
    selectedIds: state.selectedIds.filter((s) => s !== id),
    lastAddedId: state.lastAddedId === id ? null : state.lastAddedId,
  };
}

/** Alterna la selección (toggle). */
export function toggleSelection(
  state: SelectionState,
  id: string
): SelectionState {
  if (state.selectedIds.includes(id)) {
    return removeSelection(state, id);
  }
  return addSelection(state, id);
}

/** Vacía la selección completamente. */
export function clearSelection(): SelectionState {
  return {
    selectedIds: [],
    lastAddedId: null,
  };
}

/** Devuelve true si se puede ejecutar la comparación (exactamente 2). */
export function canCompare(state: SelectionState): boolean {
  return state.selectedIds.length === 2;
}

/** Genera la URL de comparación con los IDs en orden de selección (A, B). */
export function getCompareUrl(state: SelectionState): string | null {
  if (!canCompare(state)) return null;
  const [idA, idB] = state.selectedIds;
  return `/dashboard/comparar?ids=${idA},${idB}`;
}

/** Etiqueta para el estado de selección (accesible). */
export function getSelectionLabel(state: SelectionState): string {
  const count = state.selectedIds.length;
  if (count === 0) return "Ningún estudio seleccionado";
  if (count === 1) return "1 estudio seleccionado — seleccioná 1 más para comparar";
  return "2 estudios seleccionados — listos para comparar";
}

/** Etiqueta del botón principal. */
export function getCompareButtonLabel(state: SelectionState): string {
  if (canCompare(state)) return "Comparar estudios";
  return "Seleccioná 2 estudios";
}

/** Verifica si un estudio específico está seleccionado. */
export function isSelected(state: SelectionState, id: string): boolean {
  return state.selectedIds.includes(id);
}

/** Índice de selección (0 = anterior, 1 = posterior) o -1 si no seleccionado. */
export function getSelectionIndex(state: SelectionState, id: string): 0 | 1 | -1 {
  const idx = state.selectedIds.indexOf(id);
  return idx === 0 ? 0 : idx === 1 ? 1 : -1;
}