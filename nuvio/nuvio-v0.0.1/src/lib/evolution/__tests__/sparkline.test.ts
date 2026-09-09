/**
 * Tests de la lógica pura de visualización longitudinal (Fase 10.6).
 *
 * Cubre los estados y edge cases del contrato de sparkline:
 * - 3 puntos ascendentes / descendentes / estables
 * - valores negativos, cero y rango muy pequeño
 * - datos faltantes (hueco sin interpolación) y unidades incompatibles
 * - menos de 3 puntos, un solo punto, valores no numéricos
 * - múltiples segmentos
 * - no división por cero en el escalado SVG
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildSparklineModel,
  computeSparklineLayout,
  sparklineSummaryText,
  sparklineDirectionLabel,
  sparklineDirectionSymbol,
  type SparklineModel,
} from "../sparkline.ts";
import type { ParameterTrack, PointValue } from "../types.ts";

// ── Helpers ─────────────────────────────────────────────────────────────

function point(
  studyId: string,
  value: string,
  unit?: string | null,
): PointValue {
  const numeric = /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : null;
  return {
    studyId,
    date: "2026-01-01T10:00:00Z",
    value,
    numericValue: numeric,
    unit,
    referenceRange: null,
    status: undefined,
  };
}

function track(
  name: string,
  studyIds: string[],
  values: (string | null)[], // null = parámetro ausente en ese estudio
  unit?: string | null,
): ParameterTrack {
  const points: PointValue[] = [];
  studyIds.forEach((id, i) => {
    const v = values[i];
    if (v !== null) points.push(point(id, v, unit));
  });
  return {
    name,
    unit,
    referenceRange: null,
    points,
    changes: [],
  };
}

const STUDY_IDS = ["s1", "s2", "s3", "s4", "s5"];

// ── buildSparklineModel ─────────────────────────────────────────────────

describe("buildSparklineModel — puntos ascendentes / descendentes / estables", () => {
  it("3 puntos ascendentes → render, direction increased, 1 segmento, 3 puntos", () => {
    const t = track("Hb", ["s1", "s2", "s3"], ["10", "12", "14"], "g/dL");
    const model = buildSparklineModel(t, ["s1", "s2", "s3"]);
    assert.equal(model.kind, "render");
    if (model.kind !== "render") return;
    assert.equal(model.points.length, 3);
    assert.equal(model.segments.length, 1);
    assert.equal(model.segments[0].length, 3);
    assert.equal(model.summary.direction, "increased");
    assert.equal(model.minValue, 10);
    assert.equal(model.maxValue, 14);
  });

  it("3 puntos descendentes → decreased", () => {
    const t = track("Plaq", ["s1", "s2", "s3"], ["300", "250", "200"], "10^3/µL");
    const model = buildSparklineModel(t, ["s1", "s2", "s3"]);
    assert.equal(model.kind, "render");
    if (model.kind !== "render") return;
    assert.equal(model.summary.direction, "decreased");
  });

  it("valores estables → render, flat=true, direction stable", () => {
    const t = track("Peso", ["s1", "s2", "s3"], ["70", "70", "70"], "kg");
    const model = buildSparklineModel(t, ["s1", "s2", "s3"]);
    assert.equal(model.kind, "render");
    if (model.kind !== "render") return;
    assert.equal(model.flat, true);
    assert.equal(model.summary.direction, "stable");
    assert.equal(model.minValue, 70);
    assert.equal(model.maxValue, 70);
  });
});

describe("buildSparklineModel — negativos, cero, rango pequeño", () => {
  it("valores negativos → escala con min/max negativos", () => {
    const t = track("Temp", ["s1", "s2", "s3"], ["-10", "-5", "0"], "°C");
    const model = buildSparklineModel(t, ["s1", "s2", "s3"]);
    assert.equal(model.kind, "render");
    if (model.kind !== "render") return;
    assert.equal(model.minValue, -10);
    assert.equal(model.maxValue, 0);
    assert.equal(model.summary.direction, "increased");
  });

  it("cero incluido → minValue = 0, y finitas en el layout", () => {
    const t = track("Var", ["s1", "s2", "s3"], ["0", "1", "2"]);
    const model = buildSparklineModel(t, ["s1", "s2", "s3"]);
    assert.equal(model.kind, "render");
    if (model.kind !== "render") return;
    assert.equal(model.minValue, 0);
    const layout = computeSparklineLayout(model, 200, 52);
    assert.ok(layout);
    for (const p of layout!.points) {
      assert.ok(Number.isFinite(p.x));
      assert.ok(Number.isFinite(p.y));
      assert.ok(p.y >= 0 && p.y <= 52);
    }
  });

  it("rango muy pequeño → y distintas para valores distintos, sin NaN", () => {
    const t = track("Micro", ["s1", "s2", "s3"], ["10.0001", "10.0002", "10.0003"]);
    const model = buildSparklineModel(t, ["s1", "s2", "s3"]);
    assert.equal(model.kind, "render");
    if (model.kind !== "render") return;
    const layout = computeSparklineLayout(model, 200, 52);
    assert.ok(layout);
    const ys = layout!.points.map((p) => p.y);
    // 3 valores distintos → 3 posiciones y distintas
    assert.equal(new Set(ys).size, 3);
    for (const y of ys) {
      assert.ok(Number.isFinite(y));
      assert.ok(!Number.isNaN(y));
    }
  });
});

describe("buildSparklineModel — datos faltantes y unidades incompatibles", () => {
  it("estudio sin el parámetro en medio → 2 segmentos (no interpola)", () => {
    // Hb presente en s1, s3, s4 (ausente en s2) → hueco entre s1 y s3.
    const t = track("Hb", STUDY_IDS, ["10", null, "12", "14", null], "g/dL");
    const model = buildSparklineModel(t, STUDY_IDS);
    assert.equal(model.kind, "render");
    if (model.kind !== "render") return;
    assert.equal(model.segments.length, 2);
    assert.equal(model.segments[0].length, 1); // s1 aislado
    assert.equal(model.segments[1].length, 2); // s3→s4 conectados
    assert.equal(model.summary.direction, "increased");
  });

  it("unidades incompatibles entre puntos consecutivos → no conecta", () => {
    // s1 y s2 con "mg/dL", s3 con "mmol/L" → tramo [s1,s2] y [s3] aislado.
    const p1 = point("s1", "100", "mg/dL");
    const p2 = point("s2", "110", "mg/dL");
    const p3 = point("s3", "100", "mmol/L");
    const t: ParameterTrack = {
      name: "Glu",
      unit: "mg/dL",
      referenceRange: null,
      points: [p1, p2, p3],
      changes: [],
    };
    const model = buildSparklineModel(t, ["s1", "s2", "s3"]);
    assert.equal(model.kind, "render");
    if (model.kind !== "render") return;
    assert.equal(model.segments.length, 2);
    assert.equal(model.segments[0].length, 2);
    assert.equal(model.segments[1].length, 1);
  });

  it("punto no numérico intermedio → no conecta a través de él", () => {
    // 4 puntos: s1(10), s2(no numérico), s3(12), s4(14). Los 3 numéricos
    // suman >= 3 → render; pero s1→s3 no son adyacentes en el track → el
    // tramo se corta antes y después del valor no numérico.
    const p1 = point("s1", "10", "u/L");
    const p2 = point("s2", "no disponible", "u/L"); // no numérico
    const p3 = point("s3", "12", "u/L");
    const p4 = point("s4", "14", "u/L");
    const t: ParameterTrack = {
      name: "Enz",
      unit: "u/L",
      referenceRange: null,
      points: [p1, p2, p3, p4],
      changes: [],
    };
    const model = buildSparklineModel(t, ["s1", "s2", "s3", "s4"]);
    assert.equal(model.kind, "render");
    if (model.kind !== "render") return;
    assert.equal(model.points.length, 3);
    assert.equal(model.segments.length, 2); // [s1] y [s3→s4]
    assert.equal(model.segments[0].length, 1);
    assert.equal(model.segments[1].length, 2);
    assert.equal(model.summary.direction, "increased");
  });
});

describe("buildSparklineModel — casos que no se grafican", () => {
  it("menos de 3 puntos → no_render (less_than_three_points)", () => {
    const t = track("Hb", ["s1", "s2"], ["10", "12"], "g/dL");
    const model = buildSparklineModel(t, ["s1", "s2"]);
    assert.equal(model.kind, "no_render");
    if (model.kind === "no_render") {
      assert.equal(model.reason, "less_than_three_points");
    }
  });

  it("un solo punto numérico → no_render", () => {
    const t = track("Hb", ["s1", "s2", "s3"], ["10", null, null], "g/dL");
    const model = buildSparklineModel(t, STUDY_IDS);
    assert.equal(model.kind, "no_render");
  });

  it("ningún valor numérico → no_render (no_numeric_points)", () => {
    const t = track("Obs", ["s1", "s2", "s3"], ["alto", "medio", "bajo"]);
    const model = buildSparklineModel(t, ["s1", "s2", "s3"]);
    assert.equal(model.kind, "no_render");
    if (model.kind === "no_render") {
      assert.equal(model.reason, "no_numeric_points");
    }
  });

  it("3 puntos pero 2 no numéricos → no_render (solo 1 numérico)", () => {
    const t = track("Mix", ["s1", "s2", "s3"], ["10", "texto", "n/d"]);
    const model = buildSparklineModel(t, ["s1", "s2", "s3"]);
    assert.equal(model.kind, "no_render");
  });
});

describe("buildSparklineModel — múltiples segmentos", () => {
  it("hueco + cambio de unidad → segmentos correctos y dirección general", () => {
    // s1 (10 mg/dL), s2 ausente, s3 (12 mg/dL), s4 (8 mmol/L)
    const p1 = point("s1", "10", "mg/dL");
    const p3 = point("s3", "12", "mg/dL");
    const p4 = point("s4", "8", "mmol/L");
    const t: ParameterTrack = {
      name: "Par",
      unit: "mg/dL",
      referenceRange: null,
      points: [p1, p3, p4],
      changes: [],
    };
    const model = buildSparklineModel(t, ["s1", "s2", "s3", "s4"]);
    assert.equal(model.kind, "render");
    if (model.kind !== "render") return;
    // p1→p3 separados por hueco (s2) y p3→p4 por unidad → 3 tramos individuales
    assert.equal(model.segments.length, 3);
    assert.ok(model.segments.every((s) => s.length === 1));
    // Dirección general: primer 10 vs último 8 → decreased
    assert.equal(model.summary.direction, "decreased");
  });
});

// ── computeSparklineLayout ──────────────────────────────────────────────

describe("computeSparklineLayout — sin división por cero", () => {
  it("valores estables (flat) → y = height/2 finita para todos", () => {
    const t = track("Peso", ["s1", "s2", "s3"], ["70", "70", "70"], "kg");
    const model = buildSparklineModel(t, ["s1", "s2", "s3"]);
    assert.ok(model.kind === "render");
    const layout = computeSparklineLayout(model as Extract<SparklineModel, { kind: "render" }>, 200, 52);
    assert.ok(layout);
    const ys = layout!.points.map((p) => p.y);
    assert.ok(ys.every((y) => y === 26)); // height / 2
    assert.ok(ys.every((y) => Number.isFinite(y)));
    // Sin polilíneas con NaN/Infinity
    for (const pl of layout!.polylines) {
      assert.ok(!pl.points.includes("NaN"));
      assert.ok(!pl.points.includes("Infinity"));
    }
  });

  it("escala x proporcional al índice de estudio (huecos como separación)", () => {
    const t = track("Hb", STUDY_IDS, ["10", null, "12", "13", "15"], "g/dL");
    const model = buildSparklineModel(t, STUDY_IDS);
    assert.ok(model.kind === "render");
    const layout = computeSparklineLayout(model as Extract<SparklineModel, { kind: "render" }>, 200, 52);
    assert.ok(layout);
    const xs = layout!.points.map((p) => p.x);
    // Puntos presentes: s1(0), s3(2), s4(3), s5(4) en el orden del array xs.
    // Con N=5 e innerW=180 → x = 10 + idx/4 * 180: 0→10, 2→100, 3→145, 4→190.
    assert.equal(xs[0], 10);
    assert.equal(xs[1], 100);
    assert.equal(xs[2], 145);
    assert.equal(xs[3], 190);
    assert.ok(xs.every((x) => Number.isFinite(x)));
  });

  it("no_render → layout null", () => {
    const t = track("Obs", ["s1", "s2", "s3"], ["alto", "medio", "bajo"]);
    const model = buildSparklineModel(t, ["s1", "s2", "s3"]);
    assert.equal(computeSparklineLayout(model, 200, 52), null);
  });
});

// ── Texto accesible / objetivo ──────────────────────────────────────────

describe("sparklineSummaryText / dirección", () => {
  it("resumen incluye valores y tendencia objetiva", () => {
    const t = track("Hb", ["s1", "s2", "s3"], ["10", "12", "14"], "g/dL");
    const model = buildSparklineModel(t, ["s1", "s2", "s3"]);
    const text = sparklineSummaryText(model);
    assert.ok(text.includes("10 g/dL"));
    assert.ok(text.includes("12 g/dL"));
    assert.ok(text.includes("14 g/dL"));
    assert.ok(text.includes("tendencia ascendente"));
  });

  it("símbolo y label de dirección (sin depender del color)", () => {
    const up = track("A", ["s1", "s2", "s3"], ["1", "2", "3"]);
    const modelUp = buildSparklineModel(up, ["s1", "s2", "s3"]);
    assert.equal(sparklineDirectionSymbol(modelUp), "↑");
    assert.equal(sparklineDirectionLabel(modelUp), "Ascendente");

    const down = track("B", ["s1", "s2", "s3"], ["3", "2", "1"]);
    const modelDown = buildSparklineModel(down, ["s1", "s2", "s3"]);
    assert.equal(sparklineDirectionSymbol(modelDown), "↓");
    assert.equal(sparklineDirectionLabel(modelDown), "Descendente");

    const stable = track("C", ["s1", "s2", "s3"], ["5", "5", "5"]);
    const modelStable = buildSparklineModel(stable, ["s1", "s2", "s3"]);
    assert.equal(sparklineDirectionSymbol(modelStable), "·");
    assert.equal(sparklineDirectionLabel(modelStable), "Estable");
  });

  it("no_render → texto vacío", () => {
    const t = track("Obs", ["s1", "s2", "s3"], ["alto", "medio", "bajo"]);
    const model = buildSparklineModel(t, ["s1", "s2", "s3"]);
    assert.equal(sparklineSummaryText(model), "");
    assert.equal(sparklineDirectionLabel(model), "");
    assert.equal(sparklineDirectionSymbol(model), "");
  });
});