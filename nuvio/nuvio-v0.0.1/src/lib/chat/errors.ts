/**
 * Fase 7.5 — Mensajes de error controlados para el Chat IA.
 *
 * Convierte los códigos de error del módulo de chat (ChatError, GeminiError)
 * en mensajes comprensibles para el usuario, sin exponer detalles internos.
 */

export const CHAT_GENERIC_ERROR =
  "Ocurrió un error inesperado. Intentá de nuevo.";

export const CHAT_ERROR_MESSAGES: Record<string, string> = {
  // Data access / ownership
  not_found: "Conversación no encontrada o sin acceso.",
  db_error: "Ocurrió un error al guardar los datos. Intentá de nuevo.",
  // Contexto de estudios
  study_not_found: "No encontramos el estudio seleccionado.",
  study_not_ready:
    "El estudio todavía no está listo para usarse como contexto.",
  // Gemini
  gemini_timeout: "La IA tardó demasiado en responder. Intentá de nuevo.",
  gemini_network:
    "Ocurrió un problema de conexión con el servicio de IA. Intentá de nuevo.",
  gemini_api_error:
    "El servicio de IA no pudo procesar la solicitud. Intentá de nuevo más tarde.",
  gemini_invalid_response:
    "El servicio de IA devolvió una respuesta no válida. Intentá de nuevo.",
};

export function getChatErrorMessage(code: string): string {
  return CHAT_ERROR_MESSAGES[code] ?? CHAT_GENERIC_ERROR;
}
