/**
 * Tests exhaustivos del motor de evolución (Fase 10.4).
 *
 * Cubre todos los edge cases del contrato:
 * - 2 y 10 estudios
 * - Parámetro presente en todos (persistente)
 * - Parámetro nuevo / ausente (transitorio)
 * - Valores iguales / aumento / disminución
 * - Base 0 / valores negativos
 * - Valores no numéricos
 * - Unidades iguales / diferentes / ausentes
 * - Status diferentes
 * - Reference ranges diferentes
 * - Múltiples parámetros
 * - Estudios con measurements vacíos
 * - Validación de entrada (empty, 1, >10, mixed type, not chronological)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildEvolutionSeries,
  parseNumericValue,
} from "../build-series.ts";
import type { EvolutionStudy, EvolutionInput } from "../types.ts";
import type { Measurement } from "../../analysis/schema.ts";

// ── Helpers ───────────────────────────────────────────────────────

function study(
  id: string,
  created_at: string,
  measurements: Measurement[] = [],
  study_type: StudyAnalysis["study_type"] = "blood_test",
  summary = "Resumen",
): EvolutionStudy {
  return {
    id,
    created_at,
    study_type,
    summary,
    document_type: "Análisis",
    key_findings: [],
    measurements,
    observations: [],
    warnings: [],
    recommendations: [],
    limitations: [],
  };
}

function measurement(
  name: string,
  value: string,
  unit?: string | null,
  reference_range?: string | null,
  status?: Measurement["status"],
): Measurement {
  return { name, value, unit, reference_range, status };
}

function input(studies: EvolutionStudy[]): EvolutionInput {
  return { studies };
}

// ── Tests de validación de entrada ────────────────────────────────

describe("validación de entrada", () => {
  it("serie vacía → empty_series", () => {
    const result = buildEvolutionSeries(input([]));
    assert.equal(result.comparable, false);
    if (!result.comparable) assert.equal(result.incompatibility.kind, "empty_series");
  });

  it("un solo estudio → not_enough_studies", () => {
    const s = study("s1", "2026-01-01T10:00:00Z", [measurement("Hb", "14")]);
    const result = buildEvolutionSeries(input([s]));
    assert.equal(result.comparable, false);
    if (!result.comparable) assert.equal(result.incompatibility.kind, "not_enough_studies");
  });

  it("once estudios → too_many_studies", () => {
    const studies = Array.from({ length: 11 }, (_, i) =>
      study(`s${i}`, `2026-01-${String(i + 1).padStart(2, "0")}T10:00:00Z`, [measurement("Hb", "14")]),
    );
    const result = buildEvolutionSeries(input(studies));
    assert.equal(result.comparable, false);
    if (!result.comparable) assert.equal(result.incompatibility.kind, "too_many_studies");
  });

  it("tipos mezclados → mixed_study_type", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("Hb", "14")], "blood_test");
    const s2 = study("s2", "2026-01-02T10:00:00Z", [measurement("Hb", "13")], "MRI");
    const result = buildEvolutionSeries(input([s1, s2]));
    assert.equal(result.comparable, false);
    if (!result.comparable) assert.equal(result.incompatibility.kind, "mixed_study_type");
  });

  it("un estudio con measurements vacío → apto pero aporta 0 parámetros", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("Hb", "14")]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", []); // array vacío: es apto
    const result = buildEvolutionSeries(input([s1, s2]));
    assert.equal(result.comparable, true);
    if (result.comparable) {
      assert.equal(result.parameters.length, 1); // solo Hb de s1
      assert.equal(result.parameters[0].points.length, 1);
    }
  });

  it("orden no cronológico → not_chronological", () => {
    const s1 = study("s1", "2026-01-02T10:00:00Z", [measurement("Hb", "13")]); // más nuevo
    const s2 = study("s2", "2026-01-01T10:00:00Z", [measurement("Hb", "14")]); // más viejo
    const result = buildEvolutionSeries(input([s1, s2]));
    assert.equal(result.comparable, false);
    if (!result.comparable) assert.equal(result.incompatibility.kind, "not_chronological");
  });
});

// ── Tests de parseNumericValue (reutilizado de comparison) ──────────

describe("parseNumericValue", () => {
  it("enteros positivos", () => assert.equal(parseNumericValue("14"), 14));
  it("enteros negativos", () => assert.equal(parseNumericValue("-5"), -5));
  it("decimales", () => assert.equal(parseNumericValue("14.5"), 14.5));
  it("decimal negativo", () => assert.equal(parseNumericValue("-3.14"), -3.14));
  it("cero", () => assert.equal(parseNumericValue("0"), 0));
  it("con espacios → trim", () => assert.equal(parseNumericValue("  14  "), 14));
  it("con unidad → null", () => assert.equal(parseNumericValue("14 g/dL"), null));
  it("texto → null", () => assert.equal(parseNumericValue("positivo"), null));
  it("menor que → null", () => assert.equal(parseNumericValue("<5"), null));
  it("comma decimal → null", () => assert.equal(parseNumericValue("14,5"), null));
  it("vacío → null", () => assert.equal(parseNumericValue(""), null));
  it("solo espacios → null", () => assert.equal(parseNumericValue("   "), null));
});

// ── Tests básicos: 2 estudios, parámetro persistente ──────────────

describe("2 estudios — parámetro persistente", () => {
  it("aumento numérico con misma unidad", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("Hb", "13", "g/dL")]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", [measurement("Hb", "14", "g/dL")]);
    const result = buildEvolutionSeries(input([s1, s2]));
    assert.equal(result.comparable, true);
    if (result.comparable) {
      const track = result.parameters.find((p) => p.name === "Hb");
      assert.ok(track);
      assert.equal(track.points.length, 2);
      assert.equal(track.changes.length, 1);
      const change = track.changes[0]!;
      assert.equal(change.kind, "both_numeric");
      if (change.kind === "both_numeric") {
        assert.equal(change.direction, "increased");
        assert.equal(change.absoluteDifference, 1);
        assert.ok(change.percentageChange !== null);
      }
    }
  });

  it("disminución numérica", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("Hb", "14", "g/dL")]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", [measurement("Hb", "13", "g/dL")]);
    const result = buildEvolutionSeries(input([s1, s2]));
    if (result.comparable) {
      const track = result.parameters.find((p) => p.name === "Hb")!;
      const change = track.changes[0]!;
      assert.equal(change.kind, "both_numeric");
      if (change.kind === "both_numeric") assert.equal(change.direction, "decreased");
    }
  });

  it("valores iguales → stable", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("Hb", "14", "g/dL")]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", [measurement("Hb", "14", "g/dL")]);
    const result = buildEvolutionSeries(input([s1, s2]));
    if (result.comparable) {
      const track = result.parameters.find((p) => p.name === "Hb")!;
      const change = track.changes[0]!;
      assert.equal(change.kind, "both_numeric");
      if (change.kind === "both_numeric") assert.equal(change.direction, "stable");
    }
  });

  it("base 0 → percentageChange = null", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("Param", "0", "u")]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", [measurement("Param", "5", "u")]);
    const result = buildEvolutionSeries(input([s1, s2]));
    if (result.comparable) {
      const track = result.parameters.find((p) => p.name === "Param")!;
      const change = track.changes[0]!;
      assert.equal(change.kind, "both_numeric");
      if (change.kind === "both_numeric") assert.equal(change.percentageChange, null);
    }
  });

  it("valores negativos", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("Temp", "-5", "°C")]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", [measurement("Temp", "-2", "°C")]);
    const result = buildEvolutionSeries(input([s1, s2]));
    if (result.comparable) {
      const track = result.parameters.find((p) => p.name === "Temp")!;
      const change = track.changes[0]!;
      assert.equal(change.kind, "both_numeric");
      if (change.kind === "both_numeric") assert.equal(change.direction, "increased");
    }
  });
});

// ── Tests: unidades ────────────────────────────────────────────────

describe("unidades", () => {
  it("unidades diferentes → not_comparable", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("Hb", "13", "g/dL")]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", [measurement("Hb", "130", "g/L")]);
    const result = buildEvolutionSeries(input([s1, s2]));
    if (result.comparable) {
      const track = result.parameters.find((p) => p.name === "Hb")!;
      const change = track.changes[0]!;
      assert.equal(change.kind, "not_comparable");
      if (change.kind === "not_comparable") assert.ok(change.reason.includes("incompatibles"));
    }
  });

  it("unidad ausente en uno → not_comparable", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("Hb", "13", "g/dL")]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", [measurement("Hb", "13", null)]);
    const result = buildEvolutionSeries(input([s1, s2]));
    if (result.comparable) {
      const track = result.parameters.find((p) => p.name === "Hb")!;
      const change = track.changes[0]!;
      assert.equal(change.kind, "not_comparable");
    }
  });

  it("ambos sin unidad → comparables si numéricos", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("Score", "5")]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", [measurement("Score", "7")]);
    const result = buildEvolutionSeries(input([s1, s2]));
    if (result.comparable) {
      const track = result.parameters.find((p) => p.name === "Score")!;
      const change = track.changes[0]!;
      assert.equal(change.kind, "both_numeric");
    }
  });

  it("unit representative = primera con unidad", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("Hb", "13", null)]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", [measurement("Hb", "14", "g/dL")]);
    const result = buildEvolutionSeries(input([s1, s2]));
    if (result.comparable) {
      const track = result.parameters.find((p) => p.name === "Hb")!;
      assert.equal(track.unit, "g/dL");
    }
  });
});

// ── Tests: valores no numéricos ────────────────────────────────────

describe("valores no numéricos", () => {
  it("ambos no numéricos → both_non_numeric", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("Aspecto", "turbio")]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", [measurement("Aspecto", "claro")]);
    const result = buildEvolutionSeries(input([s1, s2]));
    if (result.comparable) {
      const track = result.parameters.find((p) => p.name === "Aspecto")!;
      const change = track.changes[0]!;
      assert.equal(change.kind, "both_non_numeric");
    }
  });

  it("uno numérico, otro no → one_numeric", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("Hb", "13")]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", [measurement("Hb", "positivo")]);
    const result = buildEvolutionSeries(input([s1, s2]));
    if (result.comparable) {
      const track = result.parameters.find((p) => p.name === "Hb")!;
      const change = track.changes[0]!;
      assert.equal(change.kind, "one_numeric");
    }
  });

  it("punto no numérico queda en points pero sin delta numérico", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("Hb", "13", "g/dL")]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", [measurement("Hb", "positivo", "g/dL")]);
    const result = buildEvolutionSeries(input([s1, s2]));
    if (result.comparable) {
      const track = result.parameters.find((p) => p.name === "Hb")!;
      assert.equal(track.points.length, 2);
      assert.equal(track.points[1].numericValue, null);
      assert.equal(track.points[1].value, "positivo");
    }
  });
});

// ── Tests: status y reference range ────────────────────────────────

describe("status y reference range", () => {
  it("status diferente → track.points conserva ambos", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("Hb", "13", "g/dL", "12-16", "within_range")]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", [measurement("Hb", "17", "g/dL", "12-16", "above_range")]);
    const result = buildEvolutionSeries(input([s1, s2]));
    if (result.comparable) {
      const track = result.parameters.find((p) => p.name === "Hb")!;
      assert.equal(track.points[0].status, "within_range");
      assert.equal(track.points[1].status, "above_range");
      // change debe ser both_numeric (unidades iguales)
      const change = track.changes[0]!;
      assert.equal(change.kind, "both_numeric");
    }
  });

  it("reference range diferente por punto → conservado en points", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("Hb", "13", "g/dL", "12-16")]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", [measurement("Hb", "14", "g/dL", "13-17")]);
    const result = buildEvolutionSeries(input([s1, s2]));
    if (result.comparable) {
      const track = result.parameters.find((p) => p.name === "Hb")!;
      assert.equal(track.points[0].referenceRange, "12-16");
      assert.equal(track.points[1].referenceRange, "13-17");
      // representativeRange = primera con rango
      assert.equal(track.referenceRange, "12-16");
    }
  });
});

// ── Tests: parámetros nuevos / ausentes (transitorios) ──────────────

describe("parámetros transitorios (nuevos/ausentes)", () => {
  it("parámetro nuevo en estudio 2 → track con 1 punto, changes vacío", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("Hb", "13")]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", [measurement("Hb", "14"), measurement("Glucosa", "90")]);
    const result = buildEvolutionSeries(input([s1, s2]));
    if (result.comparable) {
      const hb = result.parameters.find((p) => p.name === "Hb")!;
      const glu = result.parameters.find((p) => p.name === "Glucosa")!;
      assert.equal(hb.points.length, 2);
      assert.equal(glu.points.length, 1);
      assert.equal(glu.changes.length, 0);
      assert.equal(glu.points[0].value, "90");
    }
  });

  it("parámetro ausente en estudio 2 → track con 1 punto", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("Hb", "13"), measurement("Creatinina", "1.0")]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", [measurement("Hb", "14")]);
    const result = buildEvolutionSeries(input([s1, s2]));
    if (result.comparable) {
      const cr = result.parameters.find((p) => p.name === "Creatinina")!;
      assert.equal(cr.points.length, 1);
      assert.equal(cr.changes.length, 0);
    }
  });

  it("transientParameters cuenta parámetros no persistentes", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("A", "1"), measurement("B", "2")]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", [measurement("A", "3"), measurement("C", "4")]);
    const result = buildEvolutionSeries(input([s1, s2]));
    if (result.comparable) {
      // A: persistente (2/2), B y C: transitorios (1/2)
      assert.equal(result.overall.persistentParameters, 1);
      assert.equal(result.overall.transientParameters, 2);
    }
  });
});

// ── Tests: múltiples parámetros ────────────────────────────────────

describe("múltiples parámetros", () => {
  it("tracks ordenados por nombre (determinista)", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("Zinc", "1"), measurement("Albúmina", "2")]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", [measurement("Zinc", "3"), measurement("Albúmina", "4")]);
    const result = buildEvolutionSeries(input([s1, s2]));
    if (result.comparable) {
      assert.equal(result.parameters[0].name, "Albúmina");
      assert.equal(result.parameters[1].name, "Zinc");
    }
  });

  it("cada parámetro independiente", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [
      measurement("Hb", "13", "g/dL"),
      measurement("Glucosa", "90", "mg/dL"),
      measurement("Leucocitos", "7", "10^3/uL"),
    ]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", [
      measurement("Hb", "14", "g/dL"),
      measurement("Glucosa", "100", "mg/dL"),
      measurement("Leucocitos", "8", "10^3/uL"),
    ]);
    const result = buildEvolutionSeries(input([s1, s2]));
    if (result.comparable) {
      assert.equal(result.parameters.length, 3);
      for (const track of result.parameters) {
        assert.equal(track.points.length, 2);
        assert.equal(track.changes.length, 1);
        const change = track.changes[0]!;
        assert.equal(change.kind, "both_numeric");
      }
    }
  });
});

// ── Tests: 10 estudios ────────────────────────────────────────────

describe("10 estudios — serie completa", () => {
  it("10 puntos → 9 changes por parámetro persistente", () => {
    const studies = Array.from({ length: 10 }, (_, i) =>
      study(`s${i}`, `2026-01-${String(i + 1).padStart(2, "0")}T10:00:00Z`, [measurement("Hb", String(10 + i), "g/dL")]),
    );
    const result = buildEvolutionSeries(input(studies));
    assert.equal(result.comparable, true);
    if (result.comparable) {
      const track = result.parameters[0];
      assert.equal(track.points.length, 10);
      assert.equal(track.changes.length, 9);
      for (const change of track.changes) {
        assert.equal(change.kind, "both_numeric");
        if (change.kind === "both_numeric") assert.equal(change.direction, "increased");
      }
    }
  });

  it("overall cuenta numericChanges correctamente", () => {
    const studies = Array.from({ length: 5 }, (_, i) =>
      study(`s${i}`, `2026-01-${String(i + 1).padStart(2, "0")}T10:00:00Z`, [measurement("Hb", String(10 + i))]),
    );
    const result = buildEvolutionSeries(input(studies));
    if (result.comparable) {
      // 1 parámetro persistente * 4 changes = 4 numericChanges
      assert.equal(result.overall.numericChanges, 4);
      assert.equal(result.overall.increased, 4);
    }
  });
});

// ── Tests: estudios con measurements vacíos ────────────────────────

describe("estudios con measurements vacíos", () => {
  it("un estudio sin measurements (vacío) → serie apta", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("Hb", "13")]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", []); // vacío: apto, contribuye 0
    const result = buildEvolutionSeries(input([s1, s2]));
    assert.equal(result.comparable, true);
    if (result.comparable) assert.equal(result.parameters.length, 1);
  });

  it("estudios con algunos parámetros vacíos en array → OK si array existe", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("Hb", "13")]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", [measurement("Glucosa", "90")]);
    // Hb solo en s1, Glucosa solo en s2
    const result = buildEvolutionSeries(input([s1, s2]));
    assert.equal(result.comparable, true);
    if (result.comparable) {
      assert.equal(result.parameters.length, 2);
    }
  });
});

// ── Tests: determinismo ────────────────────────────────────────────

describe("determinismo", () => {
  it("misma entrada → misma salida (referencia)", () => {
    const studies = [
      study("s1", "2026-01-01T10:00:00Z", [measurement("A", "1"), measurement("B", "2")]),
      study("s2", "2026-01-02T10:00:00Z", [measurement("A", "3"), measurement("B", "4")]),
    ];
    const r1 = buildEvolutionSeries(input(studies));
    const r2 = buildEvolutionSeries(input(studies));
    assert.deepEqual(r1, r2);
  });

  it("no muta entrada", () => {
    const studies = [
      study("s1", "2026-01-01T10:00:00Z", [measurement("Hb", "13", "g/dL")]),
      study("s2", "2026-01-02T10:00:00Z", [measurement("Hb", "14", "g/dL")]),
    ];
    const originalStudies = structuredClone(studies);
    buildEvolutionSeries(input(studies));
    assert.deepEqual(studies, originalStudies);
  });
});

// ── Tests: overall completo ────────────────────────────────────────

describe("overall — resumen general", () => {
  it("cuenta uniqueParameters, numericChanges, notComparableChanges", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [
      measurement("Hb", "13", "g/dL"),
      measurement("Glucosa", "90", "mg/dL"),
      measurement("Aspecto", "claro"),
    ]);
    const s2 = study("s2", "2026-01-02T10:00:00Z", [
      measurement("Hb", "14", "g/dL"),
      measurement("Glucosa", "100", "mg/dL"),
      measurement("Aspecto", "turbio"),
    ]);
    const s3 = study("s3", "2026-01-03T10:00:00Z", [
      measurement("Hb", "15", "g/dL"),
      measurement("Glucosa", "110", "mmol/L"), // unidad distinta
      measurement("Creatinina", "1.0"),
    ]);
    const result = buildEvolutionSeries(input([s1, s2, s3]));
    if (result.comparable) {
      // Hb: 3 puntos, 2 changes both_numeric
      // Glucosa: 3 puntos, change 0-1 both_numeric, 1-2 not_comparable (unidad)
      // Aspecto: 2 puntos, 1 change both_non_numeric
      // Creatinina: 1 punto, 0 changes
      assert.equal(result.overall.uniqueParameters, 4);
      assert.equal(result.overall.persistentParameters, 1); // solo Hb en los 3
      assert.equal(result.overall.transientParameters, 3);  // Glucosa, Aspecto, Creatinina
      assert.equal(result.overall.numericChanges, 3); // Hb(2) + Glucosa(1)
      assert.equal(result.overall.notComparableChanges, 2); // Glucosa(1) + Aspecto(1)
    }
  });
});

// ── Tests: fechas iguales (estabilidad) ────────────────────────────

describe("fechas iguales", () => {
  it("misma created_at → orden estable (no crashea)", () => {
    const s1 = study("s1", "2026-01-01T10:00:00Z", [measurement("Hb", "13")]);
    const s2 = study("s2", "2026-01-01T10:00:00Z", [measurement("Hb", "14")]);
    const result = buildEvolutionSeries(input([s1, s2]));
    assert.equal(result.comparable, true);
    if (result.comparable) {
      const track = result.parameters[0];
      assert.equal(track.points.length, 2);
    }
  });
});