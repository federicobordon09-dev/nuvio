import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatValueWithUnit,
  formatReferenceRange,
  formatNumber,
  formatDelta,
  formatPercentageChange,
  formatSignedDelta,
  changeKind,
  numericComparisonNote,
  importanceLabel,
  getIncompatibilityMessage,
  computeComparisonTiles,
} from "../presentation.ts";
import type {
  ComparisonIncompatibility,
  MeasurementComparable,
  ComparisonResult,
} from "../types.ts";

// ── Helpers ──────────────────────────────────────────────

const valueDiff = (
  kind: MeasurementComparable["valueDiff"]["kind"],
  overrides: Partial<Extract<MeasurementComparable["valueDiff"], { kind: "both_numeric" }>> = {}
): MeasurementComparable["valueDiff"] => {
  switch (kind) {
    case "both_numeric":
      return {
        kind: "both_numeric",
        absoluteDifference: 28,
        percentageChange: 29.4736842105,
        direction: "increased",
        ...overrides,
      };
    case "both_non_numeric":
      return { kind: "both_non_numeric" };
    case "one_numeric":
      return { kind: "one_numeric" };
    default:
      return { kind: "not_comparable", reason: "Unidades distintas" };
  }
};

function comparable(
  overrides: Partial<Omit<MeasurementComparable, "name" | "status">> = {}
): MeasurementComparable {
  return {
    name: "Glucosa",
    status: "comparable",
    previousValue: "95",
    currentValue: "123",
    previousNumeric: 95,
    currentNumeric: 123,
    valueDiff: valueDiff("both_numeric"),
    unitMismatch: {
      hasMismatch: false,
      previousUnit: "mg/dL",
      currentUnit: "mg/dL",
    },
    statusDiff: {
      changed: false,
      previousStatus: "within_range",
      currentStatus: "within_range",
    },
    referenceRangeDiff: {
      changed: false,
      previousRange: "70-110",
      currentRange: "70-110",
    },
    ...overrides,
  };
}

function comparableResult(): Extract<ComparisonResult, { comparable: true }> {
  return {
    comparable: true,
    measurementDiffs: [
      comparable(),
      { name: "Triglicéridos", status: "new", measurement: { name: "Triglicéridos", value: "150", unit: "mg/dL", reference_range: "50-150", status: "within_range" } },
      { name: "Ácido úrico", status: "missing", measurement: { name: "Ácido úrico", value: "6.5", unit: "mg/dL", reference_range: "3.5-7.2", status: "within_range" } },
    ],
    keyFindingDiffs: [
      { title: "Glucosa elevada", status: "comparable", previousImportance: "high", currentImportance: "low", importanceChanged: true },
      { title: "Colesterol nuevo", status: "new", finding: { title: "Colesterol nuevo", explanation: "Colesterol ligeramente alto.", importance: "low" } },
      { title: "Hallazgo ausente", status: "missing", finding: { title: "Hallazgo ausente", explanation: "Antes presente.", importance: "unknown" } },
    ],
    overall: {
      numericSummary: {
        comparableCount: 1,
        increasedCount: 1,
        decreasedCount: 2,
        stableCount: 3,
        notComparableCount: 4,
      },
      newParametersCount: 5,
      missingParametersCount: 6,
      newFindingsCount: 7,
      missingFindingsCount: 8,
    },
  };
}

// ── formatValueWithUnit ──────────────────────────────────

describe("formatValueWithUnit", () => {
  it("valor sin unidad → solo el valor", () => {
    assert.equal(formatValueWithUnit("123", null), "123");
  });

  it("valor con unidad → \"valor unidad\"", () => {
    assert.equal(formatValueWithUnit("123", "mg/dL"), "123 mg/dL");
  });

  it("sin valor → guion", () => {
    assert.equal(formatValueWithUnit(undefined, "mg/dL"), "—");
  });

  it("valor vacío → guion", () => {
    assert.equal(formatValueWithUnit("", null), "—");
  });

  it("valor vacío pero con unidad → guion", () => {
    assert.equal(formatValueWithUnit("", "mg/dL"), "—");
  });
});

// ── formatReferenceRange ─────────────────────────────────

describe("formatReferenceRange", () => {
  it("rango válido → se mantiene", () => {
    assert.equal(formatReferenceRange("70-110"), "70-110");
  });

  it("null → null", () => {
    assert.equal(formatReferenceRange(null), null);
  });

  it("undefined → null", () => {
    assert.equal(formatReferenceRange(undefined), null);
  });

  it("rango vacío → null", () => {
    assert.equal(formatReferenceRange(""), null);
  });

  it("rango de solo espacios → null", () => {
    assert.equal(formatReferenceRange("   "), null);
  });
});

// ── formatNumber ─────────────────────────────────────────

describe("formatNumber", () => {
  it("entero → sin decimales", () => {
    assert.equal(formatNumber(123), "123");
  });

  it("decimal con más de 2 cifras → 2 cifras", () => {
    assert.equal(formatNumber(29.4736842105), "29.47");
  });

  it("0 → \"0\"", () => {
    assert.equal(formatNumber(0), "0");
  });

  it("negativo entero → sin decimales", () => {
    assert.equal(formatNumber(-5), "-5");
  });
});

// ── formatDelta ──────────────────────────────────────────

describe("formatDelta", () => {
  it("ambos numéricos → delta absoluto formateado", () => {
    assert.equal(formatDelta(comparable()), "28");
  });

  it("delta decimal no entero → 2 cifras con cero final", () => {
    assert.equal(
      formatDelta(comparable({ valueDiff: valueDiff("both_numeric", { absoluteDifference: 28.5 }) })),
      "28.50"
    );
  });

  it("kind not_comparable → null", () => {
    assert.equal(formatDelta(comparable({ valueDiff: valueDiff("not_comparable" as const) })), null);
  });

  it("kind one_numeric → null", () => {
    assert.equal(formatDelta(comparable({ valueDiff: valueDiff("one_numeric" as const) })), null);
  });

  it("kind both_non_numeric → null", () => {
    assert.equal(formatDelta(comparable({ valueDiff: valueDiff("both_non_numeric" as const) })), null);
  });
});

// ── formatPercentageChange ───────────────────────────────

describe("formatPercentageChange", () => {
  it("aumento → con signo +", () => {
    assert.equal(
      formatPercentageChange(comparable({
        valueDiff: valueDiff("both_numeric", { percentageChange: 29.4736842105 }),
      })),
      "+29.47%"
    );
  });

  it("disminución → con signo -", () => {
    assert.equal(
      formatPercentageChange(comparable({
        valueDiff: valueDiff("both_numeric", { percentageChange: -20 }),
      })),
      "-20%"
    );
  });

  it("cambio cero → 0% sin signo", () => {
    assert.equal(
      formatPercentageChange(comparable({
        valueDiff: valueDiff("both_numeric", { percentageChange: 0 }),
      })),
      "0%"
    );
  });

  it("percentageChange null → null", () => {
    assert.equal(
      formatPercentageChange(comparable({
        valueDiff: valueDiff("both_numeric", { percentageChange: null }),
      })),
      null
    );
  });

  it("no numérico → null", () => {
    assert.equal(
      formatPercentageChange(comparable({ valueDiff: valueDiff("one_numeric" as const) })),
      null
    );
  });
});

// ── formatSignedDelta ────────────────────────────────────

describe("formatSignedDelta", () => {
  it("increased → \"+28\"", () => {
    assert.equal(formatSignedDelta(comparable()), "+28");
  });

  it("decreased → \"-28\"", () => {
    assert.equal(
      formatSignedDelta(comparable({
        valueDiff: valueDiff("both_numeric", { direction: "decreased" as const }),
      })),
      "-28"
    );
  });

  it("stable → \"28\" sin signo", () => {
    assert.equal(
      formatSignedDelta(comparable({
        valueDiff: valueDiff("both_numeric", { direction: "stable" as const }),
      })),
      "28"
    );
  });

  it("not_comparable → null", () => {
    assert.equal(
      formatSignedDelta(comparable({ valueDiff: valueDiff("not_comparable" as const) })),
      null
    );
  });
});

// ── changeKind ───────────────────────────────────────────

describe("changeKind", () => {
  it("increased → \"increased\"", () => {
    assert.equal(changeKind(comparable()), "increased");
  });

  it("decreased → \"decreased\"", () => {
    assert.equal(
      changeKind(comparable({ valueDiff: valueDiff("both_numeric", { direction: "decreased" as const }) })),
      "decreased"
    );
  });

  it("stable → \"stable\"", () => {
    assert.equal(
      changeKind(comparable({ valueDiff: valueDiff("both_numeric", { direction: "stable" as const }) })),
      "stable"
    );
  });

  it("not_comparable → \"incompatible\"", () => {
    assert.equal(
      changeKind(comparable({ valueDiff: valueDiff("not_comparable" as const) })),
      "incompatible"
    );
  });

  it("one_numeric → \"non_numeric\"", () => {
    assert.equal(
      changeKind(comparable({ valueDiff: valueDiff("one_numeric" as const) })),
      "non_numeric"
    );
  });

  it("both_non_numeric → \"non_numeric\"", () => {
    assert.equal(
      changeKind(comparable({ valueDiff: valueDiff("both_non_numeric" as const) })),
      "non_numeric"
    );
  });
});

// ── numericComparisonNote ────────────────────────────────

describe("numericComparisonNote", () => {
  it("ambos numéricos → null", () => {
    assert.equal(numericComparisonNote(comparable()), null);
  });

  it("not_comparable → el motivo del motor", () => {
    const diff = comparable({ valueDiff: valueDiff("not_comparable" as const) });
    assert.equal(numericComparisonNote(diff), "Unidades distintas");
  });

  it("one_numeric → nota de un valor no numérico", () => {
    const note = numericComparisonNote(comparable({ valueDiff: valueDiff("one_numeric" as const) }));
    assert.match(note ?? "", /no es numérico/);
  });

  it("both_non_numeric → nota de ambos no numéricos", () => {
    const note = numericComparisonNote(comparable({ valueDiff: valueDiff("both_non_numeric" as const) }));
    assert.match(note ?? "", /Ambos valores no son numéricos/);
  });
});

// ── importanceLabel ──────────────────────────────────────

describe("importanceLabel", () => {
  it("high → \"Alto\"", () => {
    assert.equal(importanceLabel("high"), "Alto");
  });

  it("normal → \"Normal\"", () => {
    assert.equal(importanceLabel("normal"), "Normal");
  });

  it("undefined → \"Sin especificar\"", () => {
    assert.equal(importanceLabel(undefined), "Sin especificar");
  });

  it("null → \"Sin especificar\"", () => {
    assert.equal(importanceLabel(null), "Sin especificar");
  });

  it("valor desconocido → el valor crudo", () => {
    // Fuera del unión tipado: el fallback defensivo del runtime lo devuelve tal cual.
    assert.equal(importanceLabel("critical"), "critical");
  });
});

// ── getIncompatibilityMessage ────────────────────────────

describe("getIncompatibilityMessage", () => {
  const kinds: ComparisonIncompatibility["kind"][] = [
    "not_completed",
    "missing_study_type",
    "different_study_type",
    "empty_analysis",
  ];

  it("devuelve un mensaje legible para cada kind", () => {
    for (const kind of kinds) {
      const msg = getIncompatibilityMessage(kind);
      assert.ok(msg.length > 0, `sin mensaje para "${kind}"`);
      assert.notEqual(msg, kind, `el mensaje de "${kind}" repite el slug`);
    }
  });

  it("no expone slugs técnicos ni detalles de backend", () => {
    const messages = kinds.map(getIncompatibilityMessage);
    for (const msg of messages) {
      assert.doesNotMatch(msg, /analysis_status|study_type|_id\b/i);
      assert.doesNotMatch(msg, /slug|pending|completed|processing/i);
      assert.doesNotMatch(msg, /no está implementada|backend|detail/i);
    }
  });

  it("different_study_type explica que no pueden compararse", () => {
    assert.match(getIncompatibilityMessage("different_study_type"), /no pueden compararse/i);
  });

  it("empty_analysis habla de información insuficiente", () => {
    assert.match(getIncompatibilityMessage("empty_analysis"), /información|analizada/i);
  });
});

// ── computeComparisonTiles ───────────────────────────────

describe("computeComparisonTiles", () => {
  const tiles = computeComparisonTiles(comparableResult());
  const byKey = (key: string) => {
    const tile = tiles.find((t) => t.key === key);
    assert.ok(tile, `Falta el tile "${key}"`);
    return tile;
  };

  it("devuelve 11 tiles", () => {
    assert.equal(tiles.length, 11);
  });

  it("cambios → suma de aumentos y disminuciones", () => {
    assert.equal(byKey("changes").value, 3);
  });

  it("cambios es el primer tile y pertenece al grupo primario", () => {
    assert.equal(tiles[0].key, "changes");
    assert.equal(byKey("changes").group, "primary");
  });

  it("mediciones comparadas → overall.numericSummary.comparableCount", () => {
    assert.equal(byKey("compared").value, 1);
  });

  it("agrupa primario (qué cambió) y secundario (detalle)", () => {
    const primary = tiles.filter((t) => t.group === "primary").map((t) => t.key);
    const secondary = tiles.filter((t) => t.group === "secondary").map((t) => t.key);
    assert.deepEqual(
      primary,
      ["changes", "increased", "decreased", "stable"]
    );
    assert.deepEqual(
      secondary,
      ["compared", "new", "missing", "non_numeric", "new_findings", "missing_findings", "modified_findings"]
    );
  });

  it("primario = pocos tiles dominantes (máx 4-5)", () => {
    const primary = tiles.filter((t) => t.group === "primary");
    assert.ok(primary.length <= 5, `primario con ${primary.length} tiles`);
  });

  it("subieron → overall.numericSummary.increasedCount", () => {
    assert.equal(byKey("increased").value, 1);
  });

  it("bajaron → overall.numericSummary.decreasedCount", () => {
    assert.equal(byKey("decreased").value, 2);
  });

  it("estables → overall.numericSummary.stableCount", () => {
    assert.equal(byKey("stable").value, 3);
  });

  it("sin comparación numérica → notComparableCount", () => {
    assert.equal(byKey("non_numeric").value, 4);
  });

  it("parámetros nuevos → newParametersCount", () => {
    assert.equal(byKey("new").value, 5);
  });

  it("parámetros ausentes → missingParametersCount", () => {
    assert.equal(byKey("missing").value, 6);
  });

  it("hallazgos nuevos → newFindingsCount", () => {
    assert.equal(byKey("new_findings").value, 7);
  });

  it("hallazgos ausentes → missingFindingsCount", () => {
    assert.equal(byKey("missing_findings").value, 8);
  });

  it("hallazgos con cambio de importancia → cuenta comparables con importanciaChanged", () => {
    assert.equal(byKey("modified_findings").value, 1);
  });

  it("cada tile tiene tone (clase CSS)", () => {
    for (const tile of tiles) {
      assert.ok(/^(bg|text)-/.test(tile.tone), `tile "${tile.key}" sin tone`);
    }
  });
});