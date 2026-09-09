import type { MeasurementStatus } from "./schema";

const STATUS_SIGNIFICANCE: Record<MeasurementStatus, string> = {
  within_range: "Está dentro del rango esperado.",
  above_range: "Está por encima del rango indicado.",
  below_range: "Está por debajo del rango indicado.",
  abnormal: "Presenta un resultado inusual que requiere atención.",
  unknown: "No se pudo determinar si este valor es normal o no.",
  no_reference: "No hay rango de referencia para comparar.",
};

/**
 * Returns the best human-readable significance for a measurement.
 * Priority: explicit significance from Gemini > status-based fallback > null.
 */
export function getMeasurementSignificance(
  significance?: string,
  status?: MeasurementStatus,
): string | null {
  if (significance && significance.trim().length > 0) {
    return significance.trim();
  }
  if (status && STATUS_SIGNIFICANCE[status]) {
    return STATUS_SIGNIFICANCE[status];
  }
  return null;
}

/**
 * Human-readable label for the measurement status,
 * in plain language for patients.
 */
export function getStatusLabel(status?: MeasurementStatus): string | null {
  if (!status) return null;
  switch (status) {
    case "within_range":
      return "Dentro del rango";
    case "above_range":
      return "Por encima del rango";
    case "below_range":
      return "Por debajo del rango";
    case "abnormal":
      return "Resultado inusual";
    case "unknown":
      return "Sin determinar";
    case "no_reference":
      return "Sin referencia";
    default:
      return null;
  }
}
