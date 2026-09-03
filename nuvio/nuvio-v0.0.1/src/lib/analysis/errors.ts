/**
 * Fase 4.2.6 — Mensajes de error controlados para la acción manual de análisis.
 *
 * Los códigos provienen de AnalysisError (analyze-study.ts). Este mapeo convierte
 * cada código en un mensaje comprensible para el usuario, sin exponer stack traces
 * ni detalles internos.
 */

export const ANALYSIS_GENERIC_ERROR = "No pudimos analizar este estudio.";

export const ANALYSIS_ERROR_MESSAGES: Record<string, string> = {
  unauthenticated:
    "Iniciá sesión para continuar.",
  study_not_found:
    "No encontramos el estudio que querés analizar.",
  study_not_ready:
    "El estudio todavía no está listo para analizar.",
  extraction_error:
    "Ocurrió un error al leer el contenido extraído del estudio.",
  extraction_missing:
    "No encontramos el contenido extraído necesario para realizar el análisis.",
  extraction_empty:
    "El contenido extraído está vacío. No hay material suficiente para analizar.",
  gemini_timeout:
    "La IA tardó demasiado en responder. Intentá de nuevo.",
  gemini_network:
    "Ocurrió un problema de conexión con el servicio de IA. Intentá de nuevo.",
  gemini_api_error:
    "El servicio de IA no pudo procesar la solicitud. Intentá de nuevo más tarde.",
  gemini_invalid_response:
    "El servicio de IA devolvió una respuesta no válida. Intentá de nuevo.",
  gemini_failed:
    "Ocurrió un problema al comunicarnos con el servicio de IA.",
  persist_failed:
    "El análisis se generó pero no se pudo guardar. Intentá de nuevo.",
  analysis_in_progress:
    "El análisis ya está en curso. Esperá unos segundos.",
  /** Errores transitorios que el sistema reintenta automáticamente. */
  gemini_transient:
    "El servicio de IA está temporalmente no disponible por alta demanda. Reintentando automáticamente…",
};

export function getAnalysisErrorMessage(code: string): string {
  return ANALYSIS_ERROR_MESSAGES[code] ?? ANALYSIS_GENERIC_ERROR;
}
