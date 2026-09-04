import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildStudyChatPrompt,
  STUDY_CHAT_PROMPT,
  MAX_STUDY_CHAT_PROMPT_LENGTH,
} from "../study-chat-cta.ts";
import type { KeyFinding, Measurement } from "../../analysis/schema.ts";

/**
 * Tests de Fase 8.4 — CTA contextual hacia el Chat IA.
 *
 * Verifica que `buildStudyChatPrompt` construya sugerencias iniciales que:
 * - reflejan únicamente datos ya existentes del análisis (sin interpretación
 *   médica, sin diagnóstico, sin calificaciones de normalidad/gravedad),
 * - conservan la identidad del estudio/hallazgo/medición,
 * - no modifican ni inventan `status` ni `reference_range`.
 *
 * La persistencia de `study_id`, la ownership y la autorización se resuelven
 * server-side en `createConversationWithContextAction` (reutilizando
 * `assertStudyReadyCore`), no en este helper: aquí NO se confía en IDs del
 * cliente.
 */

// ── Helpers ──────────────────────────────────────────────────────

function makeFinding(overrides: Partial<KeyFinding> = {}): KeyFinding {
  return {
    title: "Glucosa elevada",
    explanation: "La glucosa se encuentra por encima del rango de referencia.",
    importance: "high",
    ...overrides,
  };
}

function makeMeasurement(overrides: Partial<Measurement> = {}): Measurement {
  return {
    name: "Glucosa",
    value: "123",
    unit: "mg/dL",
    reference_range: "70-110",
    status: "above_range",
    ...overrides,
  };
}

// ── CTA general (estudio) ────────────────────────────────────────

describe("buildStudyChatPrompt — CTA del estudio", () => {
  it("devuelve el prompt genérico del estudio", () => {
    assert.equal(buildStudyChatPrompt({ kind: "study" }), STUDY_CHAT_PROMPT);
  });

  it("es neutro: no afirma normalidad, anormalidad ni gravedad", () => {
    const p = buildStudyChatPrompt({ kind: "study" });
    assert.ok(p);
    assert.ok(!/peligro|grave|anormal|normal|alarma/i.test(p!));
  });
});

// ── CTA desde hallazgo ───────────────────────────────────────────

describe("buildStudyChatPrompt — CTA de hallazgo", () => {
  it("incluye el título del hallazgo", () => {
    const p = buildStudyChatPrompt({
      kind: "finding",
      finding: makeFinding({ title: "Glucosa elevada" }),
    });
    assert.equal(p, "Quiero entender mejor este hallazgo: Glucosa elevada.");
  });

  it("refleja solo el título, sin agregar datos médicos nuevos", () => {
    const finding = makeFinding({ importance: "high" });
    const p = buildStudyChatPrompt({ kind: "finding", finding })!;
    assert.ok(p.includes(finding.title));
    // No filtra la importancia/severidad ni agrega calificativos.
    assert.ok(!p.includes("high"));
    assert.ok(!p.includes("importante"));
    assert.ok(!p.includes("grave"));
  });

  it("hallazgo sin título → cae al prompt genérico del estudio", () => {
    const p = buildStudyChatPrompt({
      kind: "finding",
      finding: makeFinding({ title: "   " }),
    });
    assert.equal(p, STUDY_CHAT_PROMPT);
  });
});

// ── CTA desde medición ───────────────────────────────────────────

describe("buildStudyChatPrompt — CTA de medición", () => {
  it("conserva nombre, valor y unidad existentes", () => {
    const m = makeMeasurement({
      name: "Glucosa",
      value: "123",
      unit: "mg/dL",
    });
    const p = buildStudyChatPrompt({ kind: "measurement", measurement: m })!;
    assert.equal(p, "Quiero entender mejor este valor: Glucosa = 123 mg/dL.");
    assert.ok(p.includes("Glucosa"));
    assert.ok(p.includes("123"));
    assert.ok(p.includes("mg/dL"));
  });

  it("no modifica status ni reference_range (no incluye interpretación)", () => {
    const m = makeMeasurement({
      name: "Colesterol total",
      value: "240",
      unit: "mg/dL",
      reference_range: "<200",
      status: "above_range",
    });
    const p = buildStudyChatPrompt({ kind: "measurement", measurement: m })!;
    // No debe filtrar el estado ni el rango de referencia.
    assert.ok(!p.includes("above_range"));
    assert.ok(!p.includes("<200"));
    assert.ok(!p.includes("elevad"));
    assert.ok(!p.includes("normal"));
  });

  it("medición incompleta (sin value) → solo nombre", () => {
    const m = makeMeasurement({ value: undefined, unit: undefined });
    const p = buildStudyChatPrompt({ kind: "measurement", measurement: m });
    assert.equal(p, "Quiero entender mejor este valor: Glucosa.");
  });

  it("medición con unit null → formatea sin unidad", () => {
    const m = makeMeasurement({ value: "10", unit: null });
    const p = buildStudyChatPrompt({ kind: "measurement", measurement: m });
    assert.equal(p, "Quiero entender mejor este valor: Glucosa = 10.");
  });

  it("medición sin nombre → null (no hay sugerencia útil)", () => {
    const m = makeMeasurement({ name: "   " });
    assert.equal(
      buildStudyChatPrompt({ kind: "measurement", measurement: m }),
      null
    );
  });
});

// ── Edge cases y límites ─────────────────────────────────────────

describe("buildStudyChatPrompt — edge cases", () => {
  it("estudio inexistente/análisis vacío no corresponde: el helper solo arma texto", () => {
    // Este helper no consulta el estudio: no puede fallar por estudio inexistente.
    // La resolución server-side cubre ese caso (ver createConversationWithContextAction).
    assert.equal(typeof buildStudyChatPrompt({ kind: "study" }), "string");
  });

  it("los prompts generados respetan el límite de longitud de la URL", () => {
    const longFinding = buildStudyChatPrompt({
      kind: "finding",
      finding: makeFinding({ title: "X".repeat(500) }),
    })!;
    assert.ok(longFinding.length <= MAX_STUDY_CHAT_PROMPT_LENGTH);
  });
});
