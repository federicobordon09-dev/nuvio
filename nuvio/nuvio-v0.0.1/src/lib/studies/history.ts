/**
 * Fase 10.2 — Historial inteligente.
 *
 * Lógica pura de agrupación de estudios por tipo de estudio.
 * Los estudios sin `study_type` (análisis pendiente) se agrupan por separado
 * y no ofrecen "Ver evolución".
 *
 * Funciones puras, sin dependencias de React, framework ni DB.
 * Testeables unitariamente con `node:test`.
 */

import type { StudyType } from "../studies-utils.ts";
import {
  getStudyStage,
  getStudyTypeLabelNullable,
} from "../studies-utils.ts";

// ── Tipos ───────────────────────────────────────────────────

/** Fila mínima que representa un estudio para agrupación histórica. */
export type HistoryStudyRow = {
  id: string;
  file_name: string;
  study_type: StudyType | null;
  status: string;
  analysis_status: string;
  file_size: number;
  created_at: string;
};

/** Grupo de estudios del mismo tipo, ordenados cronológicamente. */
export type HistoryGroup = {
  studyType: StudyType | null;
  /** Label legible (ej. "Análisis de sangre", "Pendiente de análisis"). */
  label: string;
  /** Estudios del grupo, ordenados por `created_at ASC`. */
  studies: HistoryStudyRow[];
  /** Cantidad de estudios con stage `ready` (status=processed + analysis_status=completed). */
  readyCount: number;
  /** true si el grupo tiene ≥2 estudios ready y un study_type definido. */
  canEvolve: boolean;
  /** URL de la ruta de evolución con los IDs cronológicos, o null si canEvolve=false. */
  evolutionUrl: string | null;
};

// ── Funciones puras ─────────────────────────────────────────

/**
 * Un estudio está "listo para evolución" si tiene stage `ready`
 * (status = "processed" + analysis_status = "completed").
 *
 * Para la validación completa incluyendo parseStoredAnalysis(),
 * ver Fase 10.5 (server-side).
 */
export function isEvolutionReady(
  status: string,
  analysisStatus: string,
): boolean {
  return getStudyStage(status, analysisStatus) === "ready";
}

/**
 * Construye la URL de evolución con los IDs en orden cronológico.
 * Ruta: `/dashboard/evolucion?ids=<ids comas>`.
 * La ruta será creada en Fase 10.5; hasta entonces, 404 es aceptable
 * por la secuenciación explícita del roadmap.
 */
export function buildEvolutionUrl(ids: string[]): string {
  return `/dashboard/evolucion?ids=${ids.join(",")}`;
}

/**
 * Agrupa estudios por `study_type` en familias cronológicas.
 *
 * - Dentro de cada familia: ordenados por `created_at ASC` (más antiguo primero).
 * - Familias ordenadas por `max(created_at) DESC` (más reciente primero).
 * - Grupo `null` (sin tipo / "Pendiente de análisis") siempre al final.
 * - `canEvolve` = `readyCount >= 2 && studyType !== null`.
 */
export function groupStudiesByType(
  studies: HistoryStudyRow[],
): HistoryGroup[] {
  if (studies.length === 0) return [];

  // Paso 1: agrupar por study_type
  const byType = new Map<StudyType | null, HistoryStudyRow[]>();
  for (const s of studies) {
    const key = s.study_type ?? null;
    const arr = byType.get(key) ?? [];
    arr.push(s);
    byType.set(key, arr);
  }

  // Paso 2: ordenar cada grupo por created_at ASC + calcular readyCount
  const groups: HistoryGroup[] = [];
  for (const [studyType, members] of byType) {
    members.sort((a, b) =>
      a.created_at < b.created_at
        ? -1
        : a.created_at > b.created_at
          ? 1
          : 0,
    );

    const readyMembers = members.filter((s) =>
      isEvolutionReady(s.status, s.analysis_status),
    );
    const readyCount = readyMembers.length;
    const canEvolve = studyType !== null && readyCount >= 2;
    const evolutionUrl = canEvolve
      ? buildEvolutionUrl(readyMembers.map((s) => s.id))
      : null;

    groups.push({
      studyType,
      label: getStudyTypeLabelNullable(studyType),
      studies: members,
      readyCount,
      canEvolve,
      evolutionUrl,
    });
  }

  // Paso 3: ordenar grupos por max(created_at) DESC, null al final
  groups.sort((a, b) => {
    if (a.studyType === null && b.studyType === null) return 0;
    if (a.studyType === null) return 1;
    if (b.studyType === null) return -1;

    // Ya ordenados ASC, el último elemento es el más reciente
    const maxA = a.studies[a.studies.length - 1].created_at;
    const maxB = b.studies[b.studies.length - 1].created_at;
    return maxA < maxB ? 1 : maxA > maxB ? -1 : 0;
  });

  return groups;
}
