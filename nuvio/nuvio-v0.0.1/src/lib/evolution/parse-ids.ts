/**
 * Fase 10.5 — Parsing y validación de IDs para la página de evolución.
 *
 * Funciones puras, sin dependencias externas, testeables unitariamente.
 *
 * Validación fail-fast del parámetro `ids` de la URL:
 * - separa por coma y recorta espacios,
 * - detecta partes vacías y duplicadas,
 * - garantiza el rango de la serie (mín 2, máx 10) reutilizando las
 *   constantes EVOLUTION_MIN/MAX_STUDIES de la selección de serie.
 *
 * La validación completa de cada estudio (ownership, ready, tipo, orden)
 * ocurre en el servidor luego de resolver los IDs; esta capa solo valida
 * la forma de la URL para fallar rápido sin fetchear de más.
 */

import {
  EVOLUTION_MIN_STUDIES,
  EVOLUTION_MAX_STUDIES,
} from "./selection.ts";

export type ParseEvolutionIdsErrorKind =
  | "missing_ids"
  | "empty_id"
  | "duplicate_ids"
  | "not_enough_studies"
  | "too_many_studies";

export type ParseEvolutionIdsResult =
  | { ok: true; ids: string[] }
  | { ok: false; kind: ParseEvolutionIdsErrorKind; message: string };

export const EVOLUTION_PARSE_MESSAGES: Record<
  ParseEvolutionIdsErrorKind,
  string
> = {
  missing_ids:
    "Para ver la evolución necesitás indicar los estudios en la URL con el parámetro 'ids'. Ejemplo: /dashboard/evolucion?ids=ID_A,ID_B",
  empty_id:
    "Uno de los IDs está vacío. Revisá el parámetro 'ids' de la URL.",
  duplicate_ids:
    "La serie contiene estudios repetidos. Cada ID debe aparecer una sola vez.",
  not_enough_studies: `Se necesitan al menos ${EVOLUTION_MIN_STUDIES} estudios para ver una evolución.`,
  too_many_studies: `Se pueden ver como máximo ${EVOLUTION_MAX_STUDIES} estudios en una serie.`,
};

/**
 * Parsea el parámetro `ids` de la query string.
 *
 * Formato esperado: `?ids=ID_A,ID_B,...` (2 a 10 IDs separados por coma).
 *
 * Orden determinista del motivo:
 * 1. parámetro ausente/vacío,
 * 2. alguna parte vacía tras recortar,
 * 3. menos de 2 IDs,
 * 4. más de 10 IDs,
 * 5. IDs duplicados.
 *
 * Retorna `{ ok: true, ids }` (en el orden original, sin normalizar)
 * o `{ ok: false, kind, message }`.
 */
export function parseEvolutionIds(
  rawIds: string | undefined,
): ParseEvolutionIdsResult {
  if (!rawIds || rawIds.trim() === "") {
    return {
      ok: false,
      kind: "missing_ids",
      message: EVOLUTION_PARSE_MESSAGES.missing_ids,
    };
  }

  const trimmed = rawIds.split(",").map((part) => part.trim());

  if (trimmed.some((part) => part.length === 0)) {
    return {
      ok: false,
      kind: "empty_id",
      message: EVOLUTION_PARSE_MESSAGES.empty_id,
    };
  }

  if (trimmed.length < EVOLUTION_MIN_STUDIES) {
    return {
      ok: false,
      kind: "not_enough_studies",
      message: EVOLUTION_PARSE_MESSAGES.not_enough_studies,
    };
  }

  if (trimmed.length > EVOLUTION_MAX_STUDIES) {
    return {
      ok: false,
      kind: "too_many_studies",
      message: EVOLUTION_PARSE_MESSAGES.too_many_studies,
    };
  }

  if (new Set(trimmed).size !== trimmed.length) {
    return {
      ok: false,
      kind: "duplicate_ids",
      message: EVOLUTION_PARSE_MESSAGES.duplicate_ids,
    };
  }

  return { ok: true, ids: trimmed };
}