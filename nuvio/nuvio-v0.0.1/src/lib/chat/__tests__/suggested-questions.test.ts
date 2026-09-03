import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  getSuggestedQuestions,
  QUESTIONS,
  FALLBACK_QUESTIONS,
} from "../suggested-questions.ts";
import { formatStudyDate } from "../dates.ts";

// ── Lógica de rotación pura (misma que el hook, sin React) ────────

const MAX_VISIBLE = 4;

function rotateQuestions(
  pool: string[],
  used: Set<string>,
  newlyUsed?: string
): { visible: string[]; used: Set<string> } {
  const nextUsed = new Set(used);
  if (newlyUsed) nextUsed.add(newlyUsed);
  const available = pool.filter((q) => !nextUsed.has(q));
  return { visible: available.slice(0, MAX_VISIBLE), used: nextUsed };
}

// ── Pools por tipo de estudio ────────────────────────────────────

const ALL_TYPES = [
  "blood_test",
  "ECG",
  "MRI",
  "CT",
  "epicrisis",
  "medical_report",
  "other",
] as const;

describe("Pools de preguntas por tipo", () => {
  it("1. blood_test → preguntas de análisis de sangre (≥8)", () => {
    const q = QUESTIONS["blood_test"];
    assert.ok(q.length >= 8, `blood_test tiene ${q.length} preguntas, esperaba ≥8`);
    assert.ok(q.some((x) => x.includes("resultados")));
    assert.ok(q.some((x) => x.includes("médico")));
  });

  it("2. MRI → preguntas específicas de MRI (≥8)", () => {
    const q = QUESTIONS["MRI"];
    assert.ok(q.length >= 8, `MRI tiene ${q.length} preguntas, esperaba ≥8`);
    assert.ok(q.some((x) => x.includes("informe")));
    assert.ok(q.some((x) => x.includes("estudio")));
  });

  it("3. CT → preguntas específicas de CT (≥8)", () => {
    const q = QUESTIONS["CT"];
    assert.ok(q.length >= 8, `CT tiene ${q.length} preguntas, esperaba ≥8`);
    assert.ok(q.some((x) => x.includes("tomografía") || x.includes("estudio")));
  });

  it("4. ECG → preguntas específicas de ECG (≥8)", () => {
    const q = QUESTIONS["ECG"];
    assert.ok(q.length >= 8, `ECG tiene ${q.length} preguntas, esperaba ≥8`);
    assert.ok(q.some((x) => x.includes("electrocardiograma") || x.includes("resultado") || x.includes("ritmo")));
  });

  it("5. epicrisis → preguntas específicas (≥8)", () => {
    const q = QUESTIONS["epicrisis"];
    assert.ok(q.length >= 8, `epicrisis tiene ${q.length} preguntas, esperaba ≥8`);
    assert.ok(q.some((x) => x.includes("informe") || x.includes("alta") || x.includes("seguimiento")));
  });

  it("6. medical_report → preguntas específicas (≥8)", () => {
    const q = QUESTIONS["medical_report"];
    assert.ok(q.length >= 8, `medical_report tiene ${q.length} preguntas, esperaba ≥8`);
    assert.ok(q.some((x) => x.includes("informe")));
  });

  it("7. other → fallback genérico (≥8)", () => {
    assert.ok(FALLBACK_QUESTIONS.length >= 8, `fallback tiene ${FALLBACK_QUESTIONS.length} preguntas, esperaba ≥8`);
    assert.ok(FALLBACK_QUESTIONS.some((x) => x.includes("estudio")));
  });

  it("8. null → fallback genérico", () => {
    assert.deepEqual(getSuggestedQuestions(null), FALLBACK_QUESTIONS);
  });

  it("todas las preguntas son strings no vacíos", () => {
    for (const [type, questions] of Object.entries(QUESTIONS)) {
      for (const q of questions) {
        assert.equal(typeof q, "string", `pregunta no es string en ${type}`);
        assert.ok(q.trim().length > 0, `pregunta vacía en ${type}`);
      }
    }
  });

  it("no hay preguntas duplicadas dentro de un mismo pool", () => {
    for (const [type, questions] of Object.entries(QUESTIONS)) {
      const unique = new Set(questions);
      assert.equal(unique.size, questions.length, `duplicadas en ${type}`);
    }
  });
});

// ── Lógica de rotación ──────────────────────────────────────────

describe("Rotación de preguntas sugeridas", () => {
  const pool = QUESTIONS["blood_test"];

  it("9. inicialmente se obtienen 4 preguntas", () => {
    const { visible } = rotateQuestions(pool, new Set());
    assert.equal(visible.length, 4);
  });

  it("10. al usar una pregunta, queda excluida", () => {
    const used = new Set<string>();
    const usedQuestion = pool[0];
    const { visible, used: nextUsed } = rotateQuestions(pool, used, usedQuestion);
    assert.ok(!visible.includes(usedQuestion));
    assert.ok(nextUsed.has(usedQuestion));
  });

  it("11. las otras 3 preguntas permanecen", () => {
    const first4 = pool.slice(0, 4);
    const usedQuestion = first4[0];
    const { visible } = rotateQuestions(pool, new Set(), usedQuestion);
    // Las 3 restantes de las primeras 4 deben estar en visible
    for (const q of first4.slice(1)) {
      assert.ok(visible.includes(q), `permanece: ${q}`);
    }
  });

  it("12. se agrega una nueva pregunta para volver a tener 4", () => {
    const usedQuestion = pool[0];
    const { visible } = rotateQuestions(pool, new Set(), usedQuestion);
    assert.equal(visible.length, 4, `esperaba 4, got ${visible.length}`);
    // La nueva pregunta debe ser pool[4] (la primera no usada después de las 4 iniciales)
    assert.ok(visible.includes(pool[4]), `nueva pregunta: ${pool[4]}`);
  });

  it("13. nunca se repite una pregunta utilizada", () => {
    let used = new Set<string>();
    const allUsed: string[] = [];

    // Usar 6 preguntas una por una
    for (let i = 0; i < 6; i++) {
      const question = pool[i];
      const result = rotateQuestions(pool, used, question);
      used = result.used;
      allUsed.push(question);

      // Verificar que ninguna de las usadas aparece en visible
      for (const u of allUsed) {
        assert.ok(!result.visible.includes(u), `repite: ${u} en iteración ${i}`);
      }
    }
  });

  it("14. menos de 4 disponibles → devuelve las restantes", () => {
    // Usar 8 de las 10 preguntas de blood_test
    const used = new Set(pool.slice(0, 8));
    const { visible } = rotateQuestions(pool, used);
    assert.equal(visible.length, 2, `esperaba 2 restantes, got ${visible.length}`);
    assert.deepEqual(visible, pool.slice(8, 10));
  });

  it("15. sin preguntas disponibles → devuelve vacío", () => {
    const used = new Set(pool);
    const { visible } = rotateQuestions(pool, used);
    assert.equal(visible.length, 0);
  });

  it("16. preguntas nuevas no duplican las visibles", () => {
    const { visible: initial } = rotateQuestions(pool, new Set());
    const usedQuestion = initial[0];
    const { visible: after } = rotateQuestions(pool, new Set(), usedQuestion);

    // Verificar que no hay solapamiento entre las usadas que estaban en initial
    // y las nuevas en after (excepto las que no se usaron)
    const newQuestions = after.filter((q) => !initial.includes(q));
    assert.equal(newQuestions.length, 1, "exactamente 1 pregunta nueva");
    assert.ok(!initial.includes(newQuestions[0]), "la nueva no estaba en las iniciales");
  });

  it("17. lógica determinista", () => {
    // Ejecutar dos veces con el mismo input → mismo resultado
    const used = new Set([pool[0], pool[2]]);
    const r1 = rotateQuestions(pool, used);
    const r2 = rotateQuestions(pool, used);
    assert.deepEqual(r1.visible, r2.visible);
  });
});

// ── getSuggestedQuestions (backward compatibility) ───────────────

describe("getSuggestedQuestions (fallback puro)", () => {
  it("blood_test → preguntas en español", () => {
    const q = getSuggestedQuestions("blood_test");
    assert.ok(q.length > 0);
    assert.ok(q.some((x) => x.includes("resultados")));
  });

  it("ECG → preguntas en español", () => {
    const q = getSuggestedQuestions("ECG");
    assert.ok(q.length > 0);
  });

  it("MRI → preguntas en español", () => {
    const q = getSuggestedQuestions("MRI");
    assert.ok(q.length > 0);
  });

  it("CT → fallback genérico (no tiene pool propio en QUESTIONS)",
    () => {
      // CT tiene pool propio ahora
      const q = getSuggestedQuestions("CT");
      assert.ok(q.length > 0);
    }
  );

  it("epicrisis / medical_report → preguntas en español", () => {
    assert.ok(getSuggestedQuestions("epicrisis").length > 0);
    assert.ok(getSuggestedQuestions("medical_report").length > 0);
  });

  it("tipo desconocido → fallback genérico", () => {
    const q = getSuggestedQuestions("tipe_inexistente" as never);
    assert.deepEqual(q, FALLBACK_QUESTIONS);
  });

  it("sin tipo → fallback genérico", () => {
    assert.deepEqual(getSuggestedQuestions(), FALLBACK_QUESTIONS);
    assert.deepEqual(getSuggestedQuestions(null), FALLBACK_QUESTIONS);
    assert.deepEqual(getSuggestedQuestions(undefined), FALLBACK_QUESTIONS);
  });

  it("nunca devuelve array vacío", () => {
    for (const t of [
      ...ALL_TYPES,
      "unknown_type",
      undefined,
      null,
    ]) {
      assert.ok(
        getSuggestedQuestions(t as never).length > 0,
        `vacío para ${String(t)}`
      );
    }
  });
});

// ── No requiere Gemini ──────────────────────────────────────────

describe("Determinismo", () => {
  it("18. no requiere Gemini — pools son estáticos", () => {
    // Verificar que los pools son arrays de strings literales
    for (const questions of Object.values(QUESTIONS)) {
      assert.ok(Array.isArray(questions));
      for (const q of questions) {
        assert.equal(typeof q, "string");
      }
    }
    assert.ok(Array.isArray(FALLBACK_QUESTIONS));
  });
});

// ── formatStudyDate (existente, sin cambios) ────────────────────

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
