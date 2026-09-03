import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  getSuggestedQuestions,
} from "../suggested-questions.ts";
import { formatStudyDate } from "../dates.ts";

describe("getSuggestedQuestions", () => {
  it("tipo laboratorio (blood_test) → preguntas en español", () => {
    const q = getSuggestedQuestions("blood_test");
    assert.ok(q.length > 0);
    assert.ok(q.some((x) => x.includes("resultados")));
  });

  it("tipo ECG (electrocardiograma) → preguntas en español", () => {
    const q = getSuggestedQuestions("ECG");
    assert.ok(q.length > 0);
    assert.ok(q.some((x) => x.includes("este resultado")));
  });

  it("tipo imagen (MRI) → preguntas en español", () => {
    const q = getSuggestedQuestions("MRI");
    assert.ok(q.length > 0);
    assert.ok(q.some((x) => x.includes("informe")));
  });

  it("tipo imagen (CT) → mismas preguntas que demás imágenes", () => {
    const ct = getSuggestedQuestions("CT");
    const mri = getSuggestedQuestions("MRI");
    assert.ok(ct.length > 0);
    assert.deepEqual(mri, ct);
  });

  it("tipo epicrisis / informe → preguntas en español", () => {
    const epicrisis = getSuggestedQuestions("epicrisis");
    assert.ok(epicrisis.length > 0);
    assert.ok(epicrisis.some((x) => x.includes("informe")));
    const report = getSuggestedQuestions("medical_report");
    assert.ok(report.length > 0);
    assert.deepEqual(report, epicrisis);
  });

  it("tipo desconocido → usa el fallback genérico", () => {
    const q = getSuggestedQuestions("tipe_inexistente" as never);
    assert.ok(q.length > 0);
    assert.deepEqual(q, getSuggestedQuestions("other"));
  });

  it("sin tipo (undefined/null) → usa el fallback genérico", () => {
    assert.ok(getSuggestedQuestions().length > 0);
    assert.ok(getSuggestedQuestions(null).length > 0);
    assert.deepEqual(getSuggestedQuestions(undefined), getSuggestedQuestions());
  });

  it("nunca devuelve un array vacío", () => {
    for (const t of ["blood_test", "ECG", "MRI", "CT", "epicrisis", "medical_report", "other", undefined]) {
      assert.ok(getSuggestedQuestions(t as never).length > 0, `vacío para ${t}`);
    }
  });

  it("todas las preguntas son texto no vacío", () => {
    for (const t of ["blood_test", "ECG", "MRI", "epicrisis", "other"]) {
      for (const q of getSuggestedQuestions(t)) {
        assert.ok(typeof q === "string" && q.trim().length > 0);
      }
    }
  });
});

describe("formatStudyDate", () => {
  it("fecha válida ISO → fecha larga en español", () => {
    const out = formatStudyDate("2026-09-02T12:00:00.000Z");
    assert.ok(out.includes("2026"));
    assert.ok(out.length > 0);
  });

  it("sin fecha → cadena vacía", () => {
    assert.equal(formatStudyDate(undefined), "");
    assert.equal(formatStudyDate(null), "");
  });

  it("fecha inválida → cadena vacía", () => {
    assert.equal(formatStudyDate("no-es-fecha"), "");
  });
});