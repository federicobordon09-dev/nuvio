import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  EVOLUTION_MIN_STUDIES,
  EVOLUTION_MAX_STUDIES,
  SERIES_LETTERS,
  initialEvolutionSeriesState,
  beginEvolutionSeries,
  clearEvolutionSeries,
  addEvolutionStudy,
  removeEvolutionStudy,
  toggleEvolutionStudy,
  isInEvolutionSeries,
  countEvolutionSeries,
  isEvolutionSeriesFull,
  getEvolutionBadgeIndex,
  getEvolutionBadgeLabel,
  validateEvolutionSeries,
  canRunEvolution,
  getEvolutionUrl,
  getEvolutionCountLabel,
  getEvolutionCtaLabel,
  orderEvolutionStudiesAsc,
} from "../selection.ts";
import type {
  EvolutionStudy,
  EvolutionSeriesState,
  SeriesInvalidReason,
} from "../selection.ts";

// ── Helpers ──────────────────────────────────────────────

function study(
  overrides: Partial<EvolutionStudy> & { id: string; created_at: string },
): EvolutionStudy {
  return {
    study_type: "blood_test",
    status: "processed",
    analysis_status: "completed",
    ...overrides,
  };
}

const READY_BLOOD = (id: string, created_at: string): EvolutionStudy =>
  study({ id, created_at });

/** Serie de N estudios blood_test ready en fechas crecientes. */
function readyBloodSeries(n: number): EvolutionStudy[] {
  return Array.from({ length: n }, (_, i) =>
    READY_BLOOD(`s${i + 1}`, `2026-08-${String((i % 28) + 1).padStart(2, "0")}T10:00:00Z`),
  );
}

function armed(studyType: EvolutionStudy["study_type"]): EvolutionSeriesState {
  return beginEvolutionSeries(studyType as NonNullable<EvolutionStudy["study_type"]>);
}

// ── Constantes ────────────────────────────────────────────

describe("constantes de serie", () => {
  it("mínimo 2, máximo 10", () => {
    assert.equal(EVOLUTION_MIN_STUDIES, 2);
    assert.equal(EVOLUTION_MAX_STUDIES, 10);
  });

  it("letras A-J para 10 posiciones", () => {
    assert.equal(SERIES_LETTERS.length, 10);
    assert.equal(SERIES_LETTERS[0], "A");
    assert.equal(SERIES_LETTERS[9], "J");
  });
});

// ── Estado inicial y arranque ─────────────────────────────

describe("estado inicial", () => {
  it("sin familia activa ni selección", () => {
    assert.equal(initialEvolutionSeriesState.studyType, null);
    assert.deepEqual(initialEvolutionSeriesState.selectedIds, []);
    assert.equal(countEvolutionSeries(initialEvolutionSeriesState), 0);
    assert.equal(isEvolutionSeriesFull(initialEvolutionSeriesState), false);
  });

  it("beginEvolutionSeries arma una familia con selección vacía", () => {
    const s = beginEvolutionSeries("MRI");
    assert.equal(s.studyType, "MRI");
    assert.deepEqual(s.selectedIds, []);
  });

  it("beginEvolutionSeries sobre otra familia descarta la selección previa", () => {
    const blood = armed("blood_test");
    const withId = addEvolutionStudy(blood, READY_BLOOD("a", "2026-09-01T10:00:00Z"));
    assert.equal(countEvolutionSeries(withId), 1);

    const switched = beginEvolutionSeries("MRI");
    assert.equal(switched.studyType, "MRI");
    assert.equal(countEvolutionSeries(switched), 0);
  });

  it("clearEvolutionSeries vacía familia y selección", () => {
    addEvolutionStudy(armed("blood_test"), READY_BLOOD("a", "2026-09-01T10:00:00Z"));
    assert.deepEqual(clearEvolutionSeries(), initialEvolutionSeriesState);
  });
});

// ── addEvolutionStudy / remove / toggle ───────────────────

describe("addEvolutionStudy", () => {
  it("agrega un estudio ready de la familia activa", () => {
    const s = addEvolutionStudy(armed("blood_test"), READY_BLOOD("a", "2026-09-01T10:00:00Z"));
    assert.equal(countEvolutionSeries(s), 1);
    assert.equal(isInEvolutionSeries(s, "a"), true);
  });

  it("duplicado → no-op", () => {
    const first = addEvolutionStudy(armed("blood_test"), READY_BLOOD("a", "2026-09-01T10:00:00Z"));
    const dup = addEvolutionStudy(first, READY_BLOOD("a", "2026-09-01T10:00:00Z"));
    assert.equal(countEvolutionSeries(dup), 1);
  });

  it("límite de 10: el 11° estudio no se agrega", () => {
    const ready = readyBloodSeries(10);
    let s = armed("blood_test");
    for (const row of ready) {
      s = addEvolutionStudy(s, row);
    }
    assert.equal(countEvolutionSeries(s), 10);
    assert.equal(isEvolutionSeriesFull(s), true);

    const extra = READY_BLOOD("extra", "2026-09-15T10:00:00Z");
    const after = addEvolutionStudy(s, extra);
    assert.equal(countEvolutionSeries(after), 10);
    assert.equal(isInEvolutionSeries(after, "extra"), false);
  });

  it("estudio no apto (análisis pendiente) → no-op", () => {
    const pending = study({ id: "p1", created_at: "2026-09-01T10:00:00Z", analysis_status: "pending" });
    const s = addEvolutionStudy(armed("blood_test"), pending);
    assert.equal(countEvolutionSeries(s), 0);
  });

  it("estudio no apto (status de error) → no-op", () => {
    const failed = study({ id: "e1", created_at: "2026-09-01T10:00:00Z", status: "error" });
    const s = addEvolutionStudy(armed("blood_test"), failed);
    assert.equal(countEvolutionSeries(s), 0);
  });

  it("tipo distinto a la familia activa → no-op (no mezcla)", () => {
    const mri = study({ id: "m1", created_at: "2026-09-01T10:00:00Z", study_type: "MRI" });
    const s = addEvolutionStudy(armed("blood_test"), mri);
    assert.equal(countEvolutionSeries(s), 0);
  });

  it("estudio sin study_type → no-op", () => {
    const noType = study({ id: "n1", created_at: "2026-09-01T10:00:00Z", study_type: null });
    const s = addEvolutionStudy(armed("blood_test"), noType);
    assert.equal(countEvolutionSeries(s), 0);
  });

  it("sin familia activa → no-op", () => {
    const s = addEvolutionStudy(initialEvolutionSeriesState, READY_BLOOD("a", "2026-09-01T10:00:00Z"));
    assert.equal(countEvolutionSeries(s), 0);
  });
});

describe("removeEvolutionStudy", () => {
  it("quita un estudio seleccionado", () => {
    let s = armed("blood_test");
    s = addEvolutionStudy(s, READY_BLOOD("a", "2026-09-01T10:00:00Z"));
    s = addEvolutionStudy(s, READY_BLOOD("b", "2026-09-02T10:00:00Z"));
    const removed = removeEvolutionStudy(s, "a");
    assert.equal(countEvolutionSeries(removed), 1);
    assert.equal(isInEvolutionSeries(removed, "a"), false);
    assert.equal(isInEvolutionSeries(removed, "b"), true);
  });

  it("quitar un id no seleccionado → no-op", () => {
    const s = addEvolutionStudy(armed("blood_test"), READY_BLOOD("a", "2026-09-01T10:00:00Z"));
    const removed = removeEvolutionStudy(s, "zz");
    assert.deepEqual(removed, s);
  });
});

describe("toggleEvolutionStudy", () => {
  it("agrega si no está seleccionado y lo quita si lo está", () => {
    let s = armed("blood_test");
    const row = READY_BLOOD("a", "2026-09-01T10:00:00Z");

    s = toggleEvolutionStudy(s, row);
    assert.equal(isInEvolutionSeries(s, "a"), true);

    s = toggleEvolutionStudy(s, row);
    assert.equal(isInEvolutionSeries(s, "a"), false);
    assert.equal(countEvolutionSeries(s), 0);
  });
});

// ── Badges (orden de click, estable) ──────────────────────

describe("badges de serie", () => {
  it("índice 0 = primer click aunque no sea el más antiguo", () => {
    let s = armed("blood_test");
    // Se clic primero el más nuevo
    s = addEvolutionStudy(s, READY_BLOOD("newest", "2026-09-10T10:00:00Z"));
    s = addEvolutionStudy(s, READY_BLOOD("oldest", "2026-08-01T10:00:00Z"));

    assert.equal(getEvolutionBadgeIndex(s, "newest"), 0);
    assert.equal(getEvolutionBadgeIndex(s, "oldest"), 1);
    assert.equal(getEvolutionBadgeLabel(s, "newest"), "A");
    assert.equal(getEvolutionBadgeLabel(s, "oldest"), "B");
  });

  it("índice y letra sobre 10 seleccionados usan A-J", () => {
    let s = armed("blood_test");
    for (const row of readyBloodSeries(10)) {
      s = addEvolutionStudy(s, row);
    }
    assert.equal(getEvolutionBadgeLabel(s, "s10"), "J");
    assert.equal(getEvolutionBadgeIndex(s, "s5"), 4);
  });

  it("no seleccionado → índice -1 y letra null", () => {
    const s = armed("blood_test");
    assert.equal(getEvolutionBadgeIndex(s, "a"), -1);
    assert.equal(getEvolutionBadgeLabel(s, "a"), null);
  });
});

// ── Validez de serie ──────────────────────────────────────

describe("canRunEvolution", () => {
  it("sin familia activa → false", () => {
    assert.equal(canRunEvolution(initialEvolutionSeriesState, readyBloodSeries(3)), false);
  });

  it("un solo estudio → false", () => {
    let s = armed("blood_test");
    s = addEvolutionStudy(s, READY_BLOOD("a", "2026-09-01T10:00:00Z"));
    assert.equal(canRunEvolution(s, readyBloodSeries(3)), false);
  });

  it("dos ready del mismo tipo → true", () => {
    let s = armed("blood_test");
    s = addEvolutionStudy(s, READY_BLOOD("a", "2026-09-01T10:00:00Z"));
    s = addEvolutionStudy(s, READY_BLOOD("b", "2026-09-02T10:00:00Z"));
    assert.equal(canRunEvolution(s, [READY_BLOOD("a", "2026-09-01T10:00:00Z"), READY_BLOOD("b", "2026-09-02T10:00:00Z")]), true);
  });

  it("diez estudios → true", () => {
    let s = armed("blood_test");
    const rows = readyBloodSeries(10);
    for (const row of rows) s = addEvolutionStudy(s, row);
    assert.equal(canRunEvolution(s, rows), true);
  });

  it("id seleccionado que ya no está disponible → false", () => {
    let s = armed("blood_test");
    s = addEvolutionStudy(s, READY_BLOOD("a", "2026-09-01T10:00:00Z"));
    s = addEvolutionStudy(s, READY_BLOOD("b", "2026-09-02T10:00:00Z"));
    // "b" no está en la lista disponible → serie irresoluble
    assert.equal(canRunEvolution(s, [READY_BLOOD("a", "2026-09-01T10:00:00Z")]), false);
  });
});

// ── validateEvolutionSeries (utilidad servidor 10.5) ─────

describe("validateEvolutionSeries", () => {
  const reasonOf = (rows: EvolutionStudy[]): SeriesInvalidReason | null =>
    validateEvolutionSeries(rows).reason;

  it("lista vacía → not_enough_studies", () => {
    assert.equal(reasonOf([]), "not_enough_studies");
  });

  it("un solo estudio → not_enough_studies", () => {
    assert.equal(reasonOf(readyBloodSeries(1)), "not_enough_studies");
  });

  it("dos ready del mismo tipo → válida", () => {
    const v = validateEvolutionSeries(readyBloodSeries(2));
    assert.equal(v.valid, true);
    assert.equal(v.studyType, "blood_test");
    assert.equal(v.count, 2);
    assert.equal(v.reason, null);
  });

  it("once estudios → too_many_studies", () => {
    assert.equal(reasonOf(readyBloodSeries(11)), "too_many_studies");
  });

  it("estudio sin study_type → missing_study_type", () => {
    const rows = [
      study({ id: "a", created_at: "2026-08-01T10:00:00Z", study_type: null }),
      study({ id: "b", created_at: "2026-08-02T10:00:00Z", study_type: null }),
    ];
    assert.equal(reasonOf(rows), "missing_study_type");
  });

  it("tipos mixtos → mixed_study_type", () => {
    const rows = [
      study({ id: "a", created_at: "2026-08-01T10:00:00Z" }),
      study({ id: "b", created_at: "2026-08-02T10:00:00Z", study_type: "MRI" }),
    ];
    assert.equal(reasonOf(rows), "mixed_study_type");
  });

  it("estudio no ready → not_ready", () => {
    const rows = [
      study({ id: "a", created_at: "2026-08-01T10:00:00Z" }),
      study({ id: "b", created_at: "2026-08-02T10:00:00Z", analysis_status: "pending" }),
    ];
    assert.equal(reasonOf(rows), "not_ready");
  });

  it("el motivo aparece en orden determinista para dobles fallas", () => {
    // 11 filas con un type null → too_many gana porque se evalúa antes
    const elevenWithNull = Array.from({ length: 11 }, (_, i) =>
      study({ id: `n${i}`, created_at: `2026-08-${String((i % 28) + 1).padStart(2, "0")}T10:00:00Z`, study_type: null }),
    );
    assert.equal(reasonOf(elevenWithNull), "too_many_studies");
  });
});

// ── URL (orden cronológico ASC) ───────────────────────────

describe("getEvolutionUrl", () => {
  it("selección no válida → null", () => {
    let s = armed("blood_test");
    s = addEvolutionStudy(s, READY_BLOOD("a", "2026-09-01T10:00:00Z"));
    assert.equal(getEvolutionUrl(s, readyBloodSeries(3)), null);
  });

  it("dos estudios → ids en orden cronológico ASC", () => {
    let s = armed("blood_test");
    // Se clican en orden inverso al temporal
    s = addEvolutionStudy(s, READY_BLOOD("newer", "2026-09-10T10:00:00Z"));
    s = addEvolutionStudy(s, READY_BLOOD("older", "2026-08-01T10:00:00Z"));

    const url = getEvolutionUrl(s, [
      READY_BLOOD("newer", "2026-09-10T10:00:00Z"),
      READY_BLOOD("older", "2026-08-01T10:00:00Z"),
    ]);
    // El badge es A=newer (primer click), pero la serie debe ir older,newer
    assert.equal(url, "/dashboard/evolucion?ids=older,newer");
  });

  it("tres estudios mezclados → url ordenada por created_at", () => {
    let s = armed("blood_test");
    s = addEvolutionStudy(s, READY_BLOOD("mid", "2026-09-01T10:00:00Z"));
    s = addEvolutionStudy(s, READY_BLOOD("last", "2026-09-05T10:00:00Z"));
    s = addEvolutionStudy(s, READY_BLOOD("first", "2026-08-01T10:00:00Z"));

    const url = getEvolutionUrl(s, [
      READY_BLOOD("mid", "2026-09-01T10:00:00Z"),
      READY_BLOOD("last", "2026-09-05T10:00:00Z"),
      READY_BLOOD("first", "2026-08-01T10:00:00Z"),
    ]);
    assert.equal(url, "/dashboard/evolucion?ids=first,mid,last");
  });

  it("feedbacks: la url no depende del orden de clicks ∪ available desordenado", () => {
    let s = armed("blood_test");
    s = addEvolutionStudy(s, READY_BLOOD("c", "2026-09-03T10:00:00Z"));
    s = addEvolutionStudy(s, READY_BLOOD("a", "2026-09-01T10:00:00Z"));
    s = addEvolutionStudy(s, READY_BLOOD("b", "2026-09-02T10:00:00Z"));

    const url = getEvolutionUrl(s, [
      READY_BLOOD("b", "2026-09-02T10:00:00Z"),
      READY_BLOOD("c", "2026-09-03T10:00:00Z"),
      READY_BLOOD("a", "2026-09-01T10:00:00Z"),
    ]);
    assert.equal(url, "/dashboard/evolucion?ids=a,b,c");
  });
});

// ── Etiquetas de UI ───────────────────────────────────────

describe("etiquetas de UI", () => {
  const rows = readyBloodSeries(3);

  it("contador refleja la cantidad seleccionada", () => {
    let s = armed("blood_test");
    assert.equal(getEvolutionCountLabel(s), "0 de 10");
    s = addEvolutionStudy(s, READY_BLOOD("a", "2026-09-01T10:00:00Z"));
    assert.equal(getEvolutionCountLabel(s), "1 de 10");
    s = addEvolutionStudy(s, READY_BLOOD("b", "2026-09-02T10:00:00Z"));
    assert.equal(getEvolutionCountLabel(s), "2 de 10");
  });

  it("CTA: sin selección → 'Seleccioná estudios'", () => {
    const s = armed("blood_test");
    assert.equal(getEvolutionCtaLabel(s, rows), "Seleccioná estudios");
  });

  it("CTA: 1 seleccionado → 'Seleccioná 2 o más'", () => {
    const a = READY_BLOOD("a", "2026-09-01T10:00:00Z");
    const s = addEvolutionStudy(armed("blood_test"), a);
    assert.equal(getEvolutionCtaLabel(s, [a, READY_BLOOD("b", "2026-09-02T10:00:00Z")]), "Seleccioná 2 o más");
  });

  it("CTA: serie válida → 'Ver evolución'", () => {
    const a = READY_BLOOD("a", "2026-09-01T10:00:00Z");
    const b = READY_BLOOD("b", "2026-09-02T10:00:00Z");
    let s = armed("blood_test");
    s = addEvolutionStudy(s, a);
    s = addEvolutionStudy(s, b);
    assert.equal(getEvolutionCtaLabel(s, [a, b]), "Ver evolución");
  });
});

// ── orderEvolutionStudiesAsc (tiebreaker determinista 10.7) ─

describe("orderEvolutionStudiesAsc", () => {
  it("created_at idénticos → orden determinista por id (no según input)", () => {
    const z = READY_BLOOD("z-study", "2026-09-01T10:00:00Z");
    const a = READY_BLOOD("a-study", "2026-09-01T10:00:00Z");
    const m = READY_BLOOD("m-study", "2026-09-01T10:00:00Z");

    const fwd = orderEvolutionStudiesAsc([z, a, m]).map((s) => s.id);
    const bwd = orderEvolutionStudiesAsc([a, z, m]).map((s) => s.id);
    assert.deepEqual(fwd, ["a-study", "m-study", "z-study"]);
    assert.deepEqual(bwd, ["a-study", "m-study", "z-study"]);
  });

  it("created_at distintos → cronológico ASC (tiebreaker no interfiere)", () => {
    const late = READY_BLOOD("aa-id", "2026-09-02T10:00:00Z");
    const early = READY_BLOOD("zz-id", "2026-08-01T10:00:00Z");
    assert.deepEqual(
      orderEvolutionStudiesAsc([late, early]).map((s) => s.id),
      ["zz-id", "aa-id"],
    );
  });

  it("no muta el array de entrada", () => {
    const input = ["c", "b", "a"].map((id) =>
      READY_BLOOD(id, "2026-09-01T10:00:00Z"),
    );
    const copy = [...input];
    orderEvolutionStudiesAsc(input);
    assert.deepEqual(input, copy);
  });
});