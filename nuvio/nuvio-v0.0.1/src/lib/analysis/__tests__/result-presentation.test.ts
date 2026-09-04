import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getStudyResultPresentation,
  getVisibleResultSections,
  hasResultSectionContent,
  type ResultSection,
} from "../result-presentation.ts";
import type { StudyAnalysis } from "../schema.ts";
import { parseStoredAnalysis } from "../stored.ts";

/**
 * Tests de Fase 8.3 — Adaptación de la presentación por tipo de estudio.
 *
 * Verifica la configuración de presentación (orden de secciones, sección
 * primaria, labels y filtrado de secciones vacías) SIN probar lógica médica.
 */

// ── Helpers ──────────────────────────────────────────────────────

function makeAnalysis(overrides: Partial<StudyAnalysis> = {}): StudyAnalysis {
  return {
    summary: "Resumen del estudio.",
    document_type: "Documento médico",
    study_type: "blood_test",
    key_findings: [{ title: "Hallazgo 1", explanation: "Explicación." }],
    measurements: [{ name: "Glucosa", value: "100", unit: "mg/dL" }],
    observations: ["Observación 1."],
    warnings: ["Advertencia 1."],
    recommendations: ["Recomendación 1."],
    limitations: ["Limitación 1."],
    ...overrides,
  };
}

function assertBefore(order: ResultSection[], a: ResultSection, b: ResultSection) {
  assert.ok(
    order.indexOf(a) < order.indexOf(b),
    `"${a}" debería aparecer antes que "${b}" en [${order.join(", ")}]`
  );
}

// ── getStudyResultPresentation: orden por tipo ───────────────────

describe("getStudyResultPresentation — orden de secciones por tipo", () => {
  it("blood_test: measurements antes de findings", () => {
    const p = getStudyResultPresentation("blood_test");
    assertBefore(p.sectionOrder, "measurements", "findings");
    assert.equal(p.primarySection, "measurements");
  });

  it("MRI: findings antes de measurements", () => {
    const p = getStudyResultPresentation("MRI");
    assertBefore(p.sectionOrder, "findings", "measurements");
    assert.equal(p.primarySection, "findings");
  });

  it("CT: findings antes de measurements", () => {
    const p = getStudyResultPresentation("CT");
    assertBefore(p.sectionOrder, "findings", "measurements");
    assert.equal(p.primarySection, "findings");
  });

  it("ECG: measurements antes de findings, label contextual 'Parámetros'", () => {
    const p = getStudyResultPresentation("ECG");
    assertBefore(p.sectionOrder, "measurements", "findings");
    assert.equal(p.labels?.measurements, "Parámetros");
    // Ambos equilibrados: sin sección primaria única
    assert.equal(p.primarySection, undefined);
  });

  it("epicrisis: findings antes de measurements y recommendations en posición prioritaria", () => {
    const p = getStudyResultPresentation("epicrisis");
    assertBefore(p.sectionOrder, "findings", "measurements");
    assertBefore(p.sectionOrder, "recommendations", "warnings");
    assertBefore(p.sectionOrder, "recommendations", "measurements");
    assert.equal(p.primarySection, "findings");
  });

  it("medical_report: findings antes de measurements", () => {
    const p = getStudyResultPresentation("medical_report");
    assertBefore(p.sectionOrder, "findings", "measurements");
    assert.equal(p.primarySection, "findings");
  });

  it("other: fallback genérico (findings antes de measurements, sin primaria)", () => {
    const p = getStudyResultPresentation("other");
    assertBefore(p.sectionOrder, "findings", "measurements");
    assert.equal(p.primarySection, undefined);
  });

  it("null → fallback genérico", () => {
    const p = getStudyResultPresentation(null);
    assertBefore(p.sectionOrder, "findings", "measurements");
    assert.equal(p.primarySection, undefined);
  });

  it("undefined → fallback genérico", () => {
    const p = getStudyResultPresentation(undefined);
    assertBefore(p.sectionOrder, "findings", "measurements");
    assert.equal(p.primarySection, undefined);
  });

  it("tipo desconocido (no en el enum) → fallback genérico", () => {
    const p = getStudyResultPresentation("not_a_type" as never);
    assertBefore(p.sectionOrder, "findings", "measurements");
    assert.equal(p.primarySection, undefined);
  });

  it("cada tipo define las 6 secciones sin duplicados", () => {
    for (const type of ["blood_test", "MRI", "CT", "ECG", "epicrisis", "medical_report", "other"]) {
      const p = getStudyResultPresentation(type as never);
      assert.equal(p.sectionOrder.length, 6, `${type} debería tener 6 secciones`);
      assert.equal(new Set(p.sectionOrder).size, 6, `${type} no debería duplicar secciones`);
    }
  });
});

// ── hasResultSectionContent: secciones vacías ────────────────────

describe("hasResultSectionContent — secciones vacías", () => {
  it("reconoce contenido en cada sección", () => {
    const a = makeAnalysis();
    assert.equal(hasResultSectionContent(a, "findings"), true);
    assert.equal(hasResultSectionContent(a, "measurements"), true);
    assert.equal(hasResultSectionContent(a, "observations"), true);
    assert.equal(hasResultSectionContent(a, "warnings"), true);
    assert.equal(hasResultSectionContent(a, "recommendations"), true);
    assert.equal(hasResultSectionContent(a, "limitations"), true);
  });

  it("ausencia de measurements → false", () => {
    const a = makeAnalysis({ measurements: [] });
    assert.equal(hasResultSectionContent(a, "measurements"), false);
  });

  it("ausencia de findings → false", () => {
    const a = makeAnalysis({ key_findings: [] });
    assert.equal(hasResultSectionContent(a, "findings"), false);
  });

  it("ausencia de observations → false", () => {
    const a = makeAnalysis({ observations: [] });
    assert.equal(hasResultSectionContent(a, "observations"), false);
  });

  it("ausencia de warnings/recommendations/limitations → false", () => {
    const a = makeAnalysis({ warnings: [], recommendations: [], limitations: [] });
    assert.equal(hasResultSectionContent(a, "warnings"), false);
    assert.equal(hasResultSectionContent(a, "recommendations"), false);
    assert.equal(hasResultSectionContent(a, "limitations"), false);
  });
});

// ── getVisibleResultSections: orden + filtrado ───────────────────

describe("getVisibleResultSections — orden y filtrado combinados", () => {
  it("blood_test con todo el contenido → measurements primero", () => {
    const sections = getVisibleResultSections(makeAnalysis({ study_type: "blood_test" }));
    assertBefore(sections, "measurements", "findings");
    assert.equal(sections[0], "measurements");
  });

  it("MRI con todo el contenido → findings primero", () => {
    const sections = getVisibleResultSections(makeAnalysis({ study_type: "MRI" }));
    assertBefore(sections, "findings", "measurements");
    assert.equal(sections[0], "findings");
  });

  it("ECG sin measurements → no incluye measurements y no rompe", () => {
    const sections = getVisibleResultSections(
      makeAnalysis({ study_type: "ECG", measurements: [] })
    );
    assert.ok(!sections.includes("measurements"));
    assert.ok(sections.includes("findings"));
  });

  it("blood_test sin findings → no incluye findings", () => {
    const sections = getVisibleResultSections(
      makeAnalysis({ study_type: "blood_test", key_findings: [] })
    );
    assert.ok(!sections.includes("findings"));
    assert.equal(sections[0], "measurements");
  });

  it("epicrisis sin observations ni measurements → order respeta prioridades restantes", () => {
    const sections = getVisibleResultSections(
      makeAnalysis({
        study_type: "epicrisis",
        observations: [],
        measurements: [],
      })
    );
    assert.ok(!sections.includes("observations"));
    assert.ok(!sections.includes("measurements"));
    // recommendations debe estar presente y antes que warnings
    assertBefore(sections, "recommendations", "warnings");
  });

  it("análisis legacy normalizado → getVisibleResultSections lo maneja", () => {
    const legacy = {
      summary: "Análisis.",
      document_type: "Análisis de sangre",
      study_type: "blood_test",
      key_findings: [
        {
          title: "Glucosa",
          value: "123",
          unit: "mg/dL",
          status: "high",
          explanation: "Glucosa elevada.",
        },
      ],
      observations: ["Obs."],
      warnings: [],
      recommendations: ["Rec."],
      limitations: ["Lim."],
    };
    const normalized = parseStoredAnalysis(legacy);
    assert.ok(normalized);
    const sections = getVisibleResultSections(normalized!);
    // La normalización separa la medición → measurements visible y primero en lab
    assert.ok(sections.includes("measurements"));
    assert.ok(sections.includes("findings"));
    assertBefore(sections, "measurements", "findings");
  });
});
