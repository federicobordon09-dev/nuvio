/**
 * Fase 10.4 — Motor determinista de evolución longitudinal.
 *
 * Transforma una serie cronológica de estudios (mismo tipo, created_at ASC,
 * todos aptos) en ParameterTrack[] con puntos y cambios consecutivos.
 *
 * Contrato:
 * - Entrada ya validada: estudios same-type, chronological ASC, aptos.
 * - Sin side effects, sin mutación de entrada, determinista.
 * - No key_findings, no fuzzy matching, no conversión de unidades.
 */

import type { Measurement } from "../analysis/schema.ts";
import { parseNumericValue } from "../comparison/compare-studies.ts";
import type {
  EvolutionStudy,
  EvolutionInput,
  EvolutionResult,
  SeriesIncompatibility,
  ParameterTrack,
  PointValue,
  ValueChange,
  UnitCompatibility,
  EvolutionOverall,
} from "./types.ts";

/**
 * Intenta parsear un valor string como número.
 * Re-exportado desde comparison para consistencia.
 */
export { parseNumericValue } from "../comparison/compare-studies.ts";

/**
 * Verifica si las unidades difieren.
 * Unidades que difieren incluyen: strings diferentes, una definida y otra no,
 * null vs string, undefined vs string.
 * null y undefined significan "sin unidad" en el dominio.
 */
function computeUnitMismatch(
  previousUnit: string | null | undefined,
  currentUnit: string | null | undefined
): UnitCompatibility {
  const prev = previousUnit ?? undefined;
  const curr = currentUnit ?? undefined;
  const hasMismatch = prev !== curr;
  return {
    hasMismatch,
    previousUnit: prev,
    currentUnit: curr,
  };
}

/**
 * Calcula la diferencia de valor entre dos mediciones numéricas.
 */
function computeValueDiff(
  previousValue: string,
  currentValue: string,
  unitsMismatch = false
): ValueChange {
  const previousNumeric = parseNumericValue(previousValue);
  const currentNumeric = parseNumericValue(currentValue);

  if (previousNumeric !== null && currentNumeric !== null) {
    if (unitsMismatch) {
      return {
        kind: "not_comparable",
        reason: "Las unidades no coinciden y la conversión de unidades no está implementada",
      };
    }

    const absoluteDifference = Math.abs(currentNumeric - previousNumeric);
    const percentageChange =
      previousNumeric !== 0
        ? ((currentNumeric - previousNumeric) / previousNumeric) * 100
        : null;
    const direction = currentNumeric === previousNumeric
      ? "stable"
      : currentNumeric > previousNumeric
        ? "increased"
        : "decreased";
    return {
      kind: "both_numeric",
      absoluteDifference,
      percentageChange,
      direction,
    };
  }

  if (previousNumeric === null && currentNumeric === null) {
    return { kind: "both_non_numeric" };
  }

  return { kind: "one_numeric" };
}

/**
 * Valida la entrada del motor de evolución.
 * La entrada DEBE venir ya filtrada/ordenada desde la capa de aplicación,
 * pero validamos aquí para garantizar el contrato del motor.
 */
function validateEvolutionInput(input: EvolutionInput): SeriesIncompatibility | null {
  const { studies } = input;

  if (studies.length === 0) {
    return { kind: "empty_series", detail: "La serie no puede estar vacía" };
  }

  if (studies.length < 2) {
    return { kind: "not_enough_studies", detail: `Se requieren al menos 2 estudios, hay ${studies.length}` };
  }

  if (studies.length > 10) {
    return { kind: "too_many_studies", detail: `Máximo 10 estudios permitidos, hay ${studies.length}` };
  }

  // Verificar tipo homogéneo
  const firstType = studies[0].study_type;
  if (firstType === null) {
    return { kind: "mixed_study_type", detail: "El primer estudio no tiene study_type definido" };
  }
  for (const study of studies) {
    if (study.study_type !== firstType) {
      return { kind: "mixed_study_type", detail: `Tipos mezclados: "${firstType}" vs "${study.study_type}"` };
    }
  }

  // Verificar que todos tengan análisis válido (measurements array existe)
  for (const study of studies) {
    if (!study.measurements || !Array.isArray(study.measurements)) {
      return { kind: "missing_analysis", detail: `Estudio ${study.id} no tiene measurements válido` };
    }
  }

  // Verificar orden cronológico ASC por created_at
  for (let i = 1; i < studies.length; i++) {
    if (studies[i].created_at < studies[i - 1].created_at) {
      return { kind: "not_chronological", detail: "Los estudios no están ordenados por created_at ASC" };
    }
  }

  return null;
}

/**
 * Construye un PointValue a partir de un Measurement y metadatos del estudio.
 */
function buildPointValue(
  measurement: Measurement,
  studyId: string,
  date: string
): PointValue {
  const numericValue = parseNumericValue(measurement.value ?? "");
  return {
    studyId,
    date,
    value: measurement.value ?? "",
    numericValue,
    unit: measurement.unit,
    referenceRange: measurement.reference_range,
    status: measurement.status,
  };
}

/**
 * Compara dos PointValue consecutivos y produce un ValueChange.
 */
function comparePointValues(
  previous: PointValue,
  current: PointValue
): ValueChange {
  const unitCompat = computeUnitMismatch(previous.unit, current.unit);

  // Si hay mismatch de unidades, no son comparables numéricamente
  if (unitCompat.hasMismatch) {
    // Verificar si ambos son numéricos para dar razón más específica
    if (previous.numericValue !== null && current.numericValue !== null) {
      return {
        kind: "not_comparable",
        reason: `Unidades incompatibles: "${previous.unit}" vs "${current.unit}"`,
      };
    }
    // Al menos uno no es numérico
    if (previous.numericValue === null && current.numericValue === null) {
      return { kind: "both_non_numeric" };
    }
    return { kind: "one_numeric" };
  }

  // Unidades compatibles (iguales o ambas ausentes)
  // Usar computeValueDiff existente con unitsMismatch=false
  return computeValueDiff(previous.value, current.value, false);
}

/**
 * Construye los tracks de parámetros a partir de la serie de estudios.
 */
function buildParameterTracks(studies: EvolutionStudy[]): ParameterTrack[] {
  // Mapa: nombre de parámetro -> array de PointValue (uno por estudio donde existe)
  const paramMap = new Map<string, PointValue[]>();

  // Recopilar puntos por parámetro
  for (const study of studies) {
    for (const measurement of study.measurements) {
      const point = buildPointValue(measurement, study.id, study.created_at);
      const existing = paramMap.get(measurement.name);
      if (existing) {
        existing.push(point);
      } else {
        paramMap.set(measurement.name, [point]);
      }
    }
  }

  // Construir ParameterTrack para cada parámetro
  const tracks: ParameterTrack[] = [];

  for (const [name, points] of paramMap) {
    // Puntos ya están en orden porque estudios vienen ASC y procesamos en orden
    // Calcular cambios entre pares consecutivos
    const changes: (ValueChange | null)[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const change = comparePointValues(points[i], points[i + 1]);
      changes.push(change);
    }

    // Determinar unidad representativa (primera no-null)
    let representativeUnit: string | null | undefined = undefined;
    for (const p of points) {
      if (p.unit !== null && p.unit !== undefined) {
        representativeUnit = p.unit;
        break;
      }
    }
    // Si todos son null/undefined, representativeUnit queda undefined

    // Determinar reference range representativo (primero no-null)
    let representativeRange: string | null | undefined = undefined;
    for (const p of points) {
      if (p.referenceRange !== null && p.referenceRange !== undefined) {
        representativeRange = p.referenceRange;
        break;
      }
    }

    tracks.push({
      name,
      unit: representativeUnit,
      referenceRange: representativeRange,
      points,
      changes,
    });
  }

  // Ordenar tracks por nombre para salida determinista
  tracks.sort((a, b) => a.name.localeCompare(b.name));

  return tracks;
}

/**
 * Calcula el resumen general (EvolutionOverall) a partir de los tracks.
 */
function computeOverall(tracks: ParameterTrack[]): EvolutionOverall {
  let persistentParameters = 0;
  let transientParameters = 0;
  let numericChanges = 0;
  let increased = 0;
  let decreased = 0;
  let stable = 0;
  let notComparableChanges = 0;

  const totalStudies = tracks.length > 0 ? tracks[0].points.length : 0;

  for (const track of tracks) {
    // Parámetro persistente = presente en TODOS los estudios
    if (track.points.length === totalStudies) {
      persistentParameters++;
    } else {
      transientParameters++;
    }

    for (const change of track.changes) {
      if (change === null) continue; // no debería ocurrir
      if (change.kind === "both_numeric") {
        numericChanges++;
        switch (change.direction) {
          case "increased": increased++; break;
          case "decreased": decreased++; break;
          case "stable": stable++; break;
        }
      } else {
        notComparableChanges++;
      }
    }
  }

  return {
    uniqueParameters: tracks.length,
    persistentParameters,
    transientParameters,
    numericChanges,
    increased,
    decreased,
    stable,
    notComparableChanges,
  };
}

/**
 * Punto de entrada principal del motor de evolución.
 *
 * Recibe una serie validada de estudios (mismo tipo, chronological ASC, aptos)
 * y devuelve EvolutionResult con ParameterTrack[] y resumen general.
 *
 * No tiene side effects. No muta la entrada. Determinista.
 */
export function buildEvolutionSeries(input: EvolutionInput): EvolutionResult {
  const incompatibility = validateEvolutionInput(input);
  if (incompatibility !== null) {
    return { comparable: false, incompatibility };
  }

  const { studies } = input;
  const studyType = studies[0].study_type!; // validado no-null

  // No mutar: trabajar con copias si es necesario, pero aquí solo leemos
  const tracks = buildParameterTracks(studies);
  const overall = computeOverall(tracks);

  return {
    comparable: true,
    studyType,
    studies, // referencias a objetos de entrada (inmutables por contrato)
    parameters: tracks,
    overall,
  };
}

// Re-exportar tipos para uso conveniente
export type {
  EvolutionStudy,
  EvolutionInput,
  EvolutionResult,
  SeriesIncompatibility,
  ParameterTrack,
  PointValue,
  ValueChange,
  UnitCompatibility,
  StatusChange,
  ReferenceRangeChange,
  EvolutionOverall,
} from "./types.ts";