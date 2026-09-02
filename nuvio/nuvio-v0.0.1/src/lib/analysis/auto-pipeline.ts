/**
 * Fase 4.3 — Decisión pura del pipeline automático de análisis.
 *
 * Aislada del componente React para poder testearla con node:test sin montar
 * la UI ni importar Next/React (los tests usan rutas relativas, no el alias @/).
 */

export type AutoPipelineDecision =
  | { kind: "done" } // ya existe análisis → no hacer nada
  | { kind: "processing" } // documento sin procesar → procesar primero
  | { kind: "analyzing" } // procesado sin análisis → analizar
  | { kind: "failed" }; // análisis fallido → reintento manual

/**
 * Decide qué debe hacer el pipeline automático según el estado del estudio:
 * - hasAnalysis / completed → no re-ejecuta Gemini (evita dobles llamadas).
 * - processing → muestra "Analizando…" y espera (otra pestaña / en curso).
 * - failed → NO reintenta en bucle; la página muestra retry manual.
 * - status != processed → procesa primero, luego analiza.
 * - resto (pending + processed) → analiza automáticamente.
 */
export function decideAutoPipeline(opts: {
  status: string;
  analysisStatus: string;
  hasAnalysis: boolean;
}): AutoPipelineDecision {
  if (opts.hasAnalysis || opts.analysisStatus === "completed") {
    return { kind: "done" };
  }
  if (opts.analysisStatus === "processing") {
    return { kind: "analyzing" };
  }
  if (opts.analysisStatus === "failed") {
    return { kind: "failed" };
  }
  if (opts.status !== "processed") {
    return { kind: "processing" };
  }
  return { kind: "analyzing" };
}
