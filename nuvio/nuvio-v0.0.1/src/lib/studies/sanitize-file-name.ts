/**
 * F5 — Sanitización del nombre de archivo para Supabase Storage.
 *
 * El path de Storage conserva la forma:
 *
 *   {user_id}/{study_id}/{sanitized_filename}
 *
 * `user_id` y `study_id` se obtienen exclusivamente del servidor; este
 * helper sane únicamente el segmento `filename`, para que el nombre del
 * usuario no pueda:
 *
 *   - introducir separadores de path (/ o \) → path traversal;
 *   - romper la estructura user_id/study_id/filename;
 *   - contener caracteres de control o inválidos para Storage/Windows;
 *   - tener una longitud excesiva.
 *
 * Es determinista, no depende de estado, y preserva la extensión cuando es
 * razonable. No genera versionado: el upload de Nuvio usa `upsert: false`,
 * por lo que una eventual colisión de nombres falla el upload en vez de
 * sobrescribir silenciosamente un archivo existente.
 */

export const DEFAULT_MAX_FILENAME_LENGTH = 120;

export function sanitizeStorageFileName(
  input: string,
  maxLength: number = DEFAULT_MAX_FILENAME_LENGTH
): string {
  // 1. Quedarse con el último segmento (normalizando separadores), lo que
  //    elimina cualquier intento de path traversal o estructura anidada.
  let name = input.replace(/\\/g, "/").split("/").filter(Boolean).pop() ?? "";

  // 2. Eliminar caracteres de control (hex escapes: no se escriben bytes de
  //    control en el fuente).
  name = name.replace(/[\x00-\x1f\x7f]/g, "");

  // 3. Reemplazar caracteres inválidos en Windows/Storage por "_".
  name = name.replace(/[<>:"|?*]/g, "_");

  // 4. Prevenir nombres relativos (puntos iniciales como "." o "..").
  name = name.replace(/^\.+/, "");

  // 5. Normalizar espacios y quitar puntos/espacios finales.
  name = name.trim().replace(/\s+/g, " ").replace(/[.\s]+$/, "");

  // 6. Truncar conservando la extensión.
  const dot = name.lastIndexOf(".");
  let base = name;
  let ext = "";
  if (dot > 0) {
    base = name.slice(0, dot);
    ext = name.slice(dot);
  }
  const baseLimit = Math.max(1, maxLength - ext.length);
  name = base.slice(0, baseLimit) + ext;

  // 7. Fallback determinista si el nombre quedó vacío o sin contenido útil.
  if (!name) return "archivo";

  return name;
}
