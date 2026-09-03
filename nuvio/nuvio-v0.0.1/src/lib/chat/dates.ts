/**
 * Fase 7.1 — Formato de fechas legible en español para el Chat IA.
 * Se usa para mostrar en las tarjetas de estudios "2 de septiembre de 2026".
 * Solo presentación: no afecta datos ni lógica.
 */

export function formatStudyDate(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}