/**
 * Fase 9.3 — Parsing y validación de IDs para la página de comparación.
 *
 * Funciones puras, sin dependencias externas, testeables unitariamente.
 */

export type ParseIdsErrorKind =
  | "missing_ids"
  | "not_exactly_two"
  | "empty_id"
  | "duplicate_ids";

export type ParseIdsResult =
  | { ok: true; ids: [string, string] }
  | { ok: false; kind: ParseIdsErrorKind; message: string };

export const PARSE_IDS_MESSAGES: Record<ParseIdsErrorKind, string> = {
  missing_ids:
    "Para comparar estudios necesitás indicar dos IDs en la URL con el parámetro 'ids'. Ejemplo: /dashboard/comparar?ids=ID_A,ID_B",
  not_exactly_two:
    "Se requieren exactamente dos IDs de estudio separados por coma.",
  empty_id:
    "Uno de los IDs está vacío. Revisá el parámetro 'ids' de la URL.",
  duplicate_ids:
    "Los dos IDs deben ser de estudios distintos.",
};

/**
 * Parsea el parámetro `ids` de la query string.
 *
 * Formato esperado: `?ids=STUDY_A_ID,STUDY_B_ID`
 *
 * Separa por coma, recorta espacios, y valida que:
 * - el parámetro exista y no esté vacío
 * - haya exactamente 2 partes
 * - ninguna parte quede vacía tras recortar
 * - los dos IDs sean distintos
 *
 * Retorna `{ ok: true, ids }` si es válido, o `{ ok: false, kind, message }`.
 */
export function parseCompareIds(rawIds: string | undefined): ParseIdsResult {
  if (!rawIds || rawIds.trim() === "") {
    return {
      ok: false,
      kind: "missing_ids",
      message: PARSE_IDS_MESSAGES.missing_ids,
    };
  }

  const parts = rawIds.split(",");

  if (parts.length !== 2) {
    return {
      ok: false,
      kind: "not_exactly_two",
      message: PARSE_IDS_MESSAGES.not_exactly_two,
    };
  }

  const [idA, idB] = parts.map((p) => p.trim());

  if (!idA || !idB) {
    return {
      ok: false,
      kind: "empty_id",
      message: PARSE_IDS_MESSAGES.empty_id,
    };
  }

  if (idA === idB) {
    return {
      ok: false,
      kind: "duplicate_ids",
      message: PARSE_IDS_MESSAGES.duplicate_ids,
    };
  }

  return { ok: true, ids: [idA, idB] };
}