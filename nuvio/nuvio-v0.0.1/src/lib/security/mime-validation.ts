import { fileTypeFromBuffer } from "file-type";

const MIME_MAP: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

const ALLOWED_MIME_TYPES = new Set(Object.keys(MIME_MAP));

/**
 * Validates a file's MIME type by inspecting its magic-number signature
 * (not just the extension or the browser-provided type).
 *
 * @param buffer - First chunk of the file (at least 4100 bytes recommended for file-type)
 * @param extension - Expected file extension (e.g. ".pdf")
 * @returns The detected MIME type if valid, or throws if unrecognised or disallowed.
 */
export async function validateMimeType(
  buffer: ArrayBuffer,
  extension: string
): Promise<string> {
  const detected = await fileTypeFromBuffer(Buffer.from(buffer));

  if (!detected) {
    throw new Error(
      "No se pudo detectar el tipo de archivo. Archivo no válido."
    );
  }

  const allowedExts = MIME_MAP[detected.mime];
  if (!allowedExts) {
    throw new Error(`Tipo de archivo no permitido: ${detected.mime}`);
  }

  const normalizedExt = extension.toLowerCase();
  if (!allowedExts.some((e) => e === normalizedExt || extension.startsWith(e))) {
    throw new Error(
      `Extensión "${extension}" no coincide con el tipo detectado "${detected.mime}".`
    );
  }

  return detected.mime;
}

export { ALLOWED_MIME_TYPES };