import { safeParseStudyAnalysis, type StudyAnalysis } from "./schema.ts";

/**
 * Fase 4.2.5 — Parseo seguro del análisis almacenado en study_analyses.
 *
 * El dato ya fue validado por Zod antes de persistirse, pero no se confía
 * ciegamente en datos históricos de la DB. Devuelve el StudyAnalysis si el
 * dato almacenado es válido; null en caso contrario (para no romper la página).
 */
export function parseStoredAnalysis(
  data: Record<string, unknown>
): StudyAnalysis | null {
  const result = safeParseStudyAnalysis(data);
  return result.success ? result.data : null;
}
