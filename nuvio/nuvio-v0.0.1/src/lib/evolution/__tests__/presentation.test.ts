import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatLongDate,
  formatShortDate,
  getSeriesDateRangeLabel,
  getSeriesIncompatibilityMessage,
  changeSymbol,
  changeLabel,
  changeTone,
  formatChangeDelta,
  formatChangePercent,
  computeEvolutionTiles,
  type EvolutionOverall,
} from "../presentation.ts";
import type { ValueChange, SeriesIncompatibility } from "../types.ts";

// ── Helpers ──────────────────────────────────────────────

function bothNumeric(
  kind: "increased" | "decreased" | "stable",
): ValueChange {
  const pct = kind === "increased" ? 20 : kind === "decreased" ? -20 : 0;
  return { kind: "both_numeric", absoluteDifference: 10, percentageChange: pct, direction: kind };
}

function notComparable(): ValueChange {
  return { kind: "not_comparable", reason: "Unidades incompatibles: mg/dL vs mmol/L" };
}

function oneNumeric(): ValueChange {
  return { kind: "one_numeric" };
}

function bothNonNumeric(): ValueChange {
  return { kind: "both_non_numeric" };
}

// ── Tests ────────────────────────────────────────────────

describe("formatLongDate", () => {
  it("ISO válida → fecha larga en español (es-AR)", () => {
    // 2026-09-07T10:30:00Z
    const result = formatLongDate("2026-09-07T10:30:00Z");
    // Dependiendo del locale, es-AR usa "7 de septiembre de 2026"
    assert.ok(result.includes("septiembre"));
    assert.ok(result.includes("2026"));
  });

  it("fecha inválida → string vacío", () => {
    assert.equal(formatLongDate("no-una-fecha"), "");
  });

  it("string vacío → string vacío", () => {
    assert.equal(formatLongDate(""), "");
  });
});

describe("formatShortDate", () => {
  it("ISO válida → fecha corta en español (es-AR)", () => {
    const result = formatShortDate("2026-09-07T10:30:00Z");
    assert.ok(result.length > 0);
    // es-AR produce "07 de sept de 26" o similar; solo validamos no vacío
  });

  it("fecha inválida → string vacío", () => {
    assert.equal(formatShortDate("bad"), "");
  });
});

describe("getSeriesDateRangeLabel", () => {
  it("lista vacía → string vacío", () => {
    assert.equal(getSeriesDateRangeLabel([]), "");
  });

  it("un solo estudio → solo la fecha de ese estudio", () => {
    const label = getSeriesDateRangeLabel([{ created_at: "2026-09-01T10:00:00Z" }]);
    assert.ok(label.length > 0);
    assert.ok(!label.includes("→"));
  });

  it("dos estudios → from → to", () => {
    const label = getSeriesDateRangeLabel([
      { created_at: "2026-08-01T10:00:00Z" },
      { created_at: "2026-09-07T10:00:00Z" },
    ]);
    assert.ok(label.includes("→"));
  });
});

describe("getSeriesIncompatibilityMessage", () => {
  it("cada kind tiene mensaje legible sin slugs técnicos", () => {
    const kinds: SeriesIncompatibility["kind"][] = [
      "empty_series",
      "not_enough_studies",
      "too_many_studies",
      "mixed_study_type",
      "missing_analysis",
      "not_chronological",
    ];
    for (const kind of kinds) {
      const m = getSeriesIncompatibilityMessage(kind);
      assert.ok(m.length > 0);
      // No debe exponer el kind técnico
      assert.ok(!m.includes("_"));
    }
  });
});

describe("changeSymbol", () => {
  it("increased → ↑", () => assert.equal(changeSymbol(bothNumeric("increased")), "↑"));
  it("decreased → ↓", () => assert.equal(changeSymbol(bothNumeric("decreased")), "↓"));
  it("stable → ·", () => assert.equal(changeSymbol(bothNumeric("stable")), "·"));
  it("not_comparable → ⊘", () => assert.equal(changeSymbol(notComparable()), "⊘"));
  it("one_numeric → ⊘", () => assert.equal(changeSymbol(oneNumeric()), "⊘"));
  it("both_non_numeric → ⊘", () => assert.equal(changeSymbol(bothNonNumeric()), "⊘"));
});

describe("changeLabel", () => {
  it("increased → Aumentó", () => assert.equal(changeLabel(bothNumeric("increased")), "Aumentó"));
  it("decreased → Disminuyó", () => assert.equal(changeLabel(bothNumeric("decreased")), "Disminuyó"));
  it("stable → Estable", () => assert.equal(changeLabel(bothNumeric("stable")), "Estable"));
  it("not_comparable → No comparable", () => assert.equal(changeLabel(notComparable()), "No comparable"));
  it("one_numeric → Uno de los valores no es numérico", () => assert.equal(changeLabel(oneNumeric()), "Uno de los valores no es numérico"));
  it("both_non_numeric → Ambos valores no son numéricos", () => assert.equal(changeLabel(bothNonNumeric()), "Ambos valores no son numéricos"));
});

describe("changeTone", () => {
  it("increased → warning-tint", () => assert.ok(changeTone(bothNumeric("increased")).includes("warning-tint")));
  it("decreased → info-tint", () => assert.ok(changeTone(bothNumeric("decreased")).includes("info-tint")));
  it("stable → muted", () => assert.ok(changeTone(bothNumeric("stable")).includes("muted")));
  it("no numérico → muted", () => assert.ok(changeTone(notComparable()).includes("muted")));
});

describe("formatChangeDelta", () => {
  it("increased → '+10'", () => assert.equal(formatChangeDelta(bothNumeric("increased")), "+10"));
  it("decreased → '-10'", () => assert.equal(formatChangeDelta(bothNumeric("decreased")), "-10"));
  it("stable → '10' (sin signo)", () => assert.equal(formatChangeDelta(bothNumeric("stable")), "10"));
  it("no numérico → null", () => assert.equal(formatChangeDelta(notComparable()), null));
  it("decimales: 10.5 → '10.50'", () => {
    const c: ValueChange = { kind: "both_numeric", absoluteDifference: 10.5, percentageChange: 20, direction: "increased" };
    assert.equal(formatChangeDelta(c), "+10.50");
  });
});

describe("formatChangePercent", () => {
  it("increased 20% → '+20%'", () => assert.equal(formatChangePercent(bothNumeric("increased")), "+20%"));
  it("decreased -20% → '-20%' (el número ya trae el signo)", () => assert.equal(formatChangePercent(bothNumeric("decreased")), "-20%"));
  it("stable 0% → '0%' (sin signo +)", () => {
    const c: ValueChange = { kind: "both_numeric", absoluteDifference: 0, percentageChange: 0, direction: "stable" };
    assert.equal(formatChangePercent(c), "0%");
  });
  it("percentageChange null → null", () => {
    const c: ValueChange = { kind: "both_numeric", absoluteDifference: 5, percentageChange: null, direction: "increased" };
    assert.equal(formatChangePercent(c), null);
  });
  it("no numérico → null", () => assert.equal(formatChangePercent(notComparable()), null));
});

describe("computeEvolutionTiles", () => {
  const overall: EvolutionOverall = {
    uniqueParameters: 15,
    persistentParameters: 10,
    transientParameters: 5,
    numericChanges: 12,
    increased: 6,
    decreased: 3,
    stable: 3,
    notComparableChanges: 4,
  };

  it("primary: 4 tiles (Cambios, Aumentaron, Disminuyeron, Sin cambios)", () => {
    const tiles = computeEvolutionTiles(overall);
    const primary = tiles.filter((t) => t.group === "primary");
    assert.equal(primary.length, 4);
    assert.deepEqual(primary.map((t) => t.key), ["changes", "increased", "decreased", "stable"]);
  });

  it("secondary: 4 tiles (Parámetros, En todos, En algunos, Sin comparación)", () => {
    const tiles = computeEvolutionTiles(overall);
    const secondary = tiles.filter((t) => t.group === "secondary");
    assert.equal(secondary.length, 4);
    assert.deepEqual(secondary.map((t) => t.key), ["parameters", "persistent", "transient", "not_comparable"]);
  });

  it("valores correctos en primary", () => {
    const tiles = computeEvolutionTiles(overall);
    const t = tiles.find((x) => x.key === "changes");
    assert.equal(t?.value, 12);
    assert.equal(t?.tone, "bg-violet text-white");
  });

  it("valores correctos en secondary", () => {
    const tiles = computeEvolutionTiles(overall);
    const t = tiles.find((x) => x.key === "parameters");
    assert.equal(t?.value, 15);
    assert.equal(t?.tone, "bg-violet-tint text-violet");
  });

  it("todos los tiles tienen label, value, tone, group", () => {
    const tiles = computeEvolutionTiles(overall);
    for (const tile of tiles) {
      assert.ok(tile.label.length > 0);
      assert.ok(typeof tile.value === "number");
      assert.ok(tile.tone.length > 0);
      assert.ok(tile.group === "primary" || tile.group === "secondary");
    }
  });
});