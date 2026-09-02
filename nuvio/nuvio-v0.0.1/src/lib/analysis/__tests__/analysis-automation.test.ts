import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { analyzeStudyWithDeps, AnalysisError } from "../analyze-study.ts";
import { GeminiError } from "../gemini.ts";
import { decideAutoPipeline } from "../auto-pipeline.ts";

/**
 * Tests de la Fase 4.3 — Automatización del análisis.
 *
 * Se inyecta un fake de Supabase (patrón 4.2.7) para cubrir el pipeline
 * completo de `analyzeStudyWithDeps` SIN llamar a Gemini ni a Supabase reales,
 * y se testea la decisión pura del cliente (`decideAutoPipeline`) que evita
 * re-ejecutar Gemini sobre estudios ya analizados.
 */

// ── Fake de Supabase ─────────────────────────────────────────────

type Row = Record<string, unknown>;

type FakeInit = {
  user: { id: string } | null;
  study: Row;
  extraction?: Row | null;
};

function createFakeSupabase(initial: FakeInit) {
  const state = {
    studies: initial.study ? { ...initial.study } : null,
    study_extractions: initial.extraction
      ? { ...initial.extraction }
      : null,
  };
  const calls: string[] = [];

  function makeBuilder(table: string) {
    let op: "read" | "write" = "read";
    let pendingUpdate: Row | null = null;
    const filters: { col: string; val: unknown; neg: boolean }[] = [];

    const rowsFor = (t: string): Row[] =>
      t === "studies"
        ? state.studies
          ? [state.studies]
          : []
        : state.study_extractions
        ? [state.study_extractions]
        : [];

    const match = (row: Row) =>
      filters.every((f) => {
        const hits = row[f.col] === f.val;
        return f.neg ? !hits : hits;
      });

    const buildResult = async () => {
      if (op === "write") {
        const affected = rowsFor(table).filter(match);
        if (pendingUpdate) {
          for (const r of affected) Object.assign(r, pendingUpdate);
        }
        const ids = affected.map((r) => ({ id: r.id }));
        // El claim (update + select) debe devolver la fila reclamada o [].
        return { data: ids.length ? ids : [], error: null };
      }
      return { data: rowsFor(table).filter(match), error: null };
    };

    const q = {
      eq(col: string, val: unknown) {
        filters.push({ col, val, neg: false });
        return q;
      },
      neq(col: string, val: unknown) {
        filters.push({ col, val, neg: true });
        return q;
      },
      select(cols: string) {
        calls.push(`${table}.select(${cols})`);
        return q;
      },
      update(data: Row) {
        op = "write";
        pendingUpdate = data;
        calls.push(`${table}.update`);
        return q;
      },
      async single() {
        const { data } = await buildResult();
        const rows = data as Row[];
        return rows.length
          ? { data: rows[0], error: null }
          : { data: null, error: { message: "not found" } };
      },
      async maybeSingle() {
        const { data } = await buildResult();
        const rows = data as Row[];
        return { data: rows[0] ?? null, error: null };
      },
      then(onF: (v: unknown) => unknown, onR: (e: unknown) => unknown) {
        return buildResult().then(onF, onR);
      },
    };
    return q;
  }

  return {
    calls,
    getState: () => state,
    auth: {
      getUser: async () => ({ data: { user: initial.user } }),
    },
    from(table: string) {
      calls.push(`from(${table})`);
      return makeBuilder(table);
    },
  };
}

// ── Fábricas de estado inicial ───────────────────────────────────

const USER_ID = "user-1";
const STUDY_ID = "study-1";

const VALID_ANALYSIS = {
  summary: "Análisis de sangre con glucosa elevada.",
  document_type: "Análisis de sangre",
  key_findings: [
    {
      title: "Glucosa",
      value: "123",
      unit: "mg/dL",
      reference_range: "70-110 mg/dL",
      status: "high",
      explanation: "Por encima del rango.",
    },
  ],
  observations: ["Glucosa elevada."],
  warnings: ["Requiere atención médica."],
  recommendations: ["Consultar profesional."],
  limitations: ["Sin historia clínica previa."],
};

function makeStudy(overrides: Row = {}): Row {
  return {
    id: STUDY_ID,
    user_id: USER_ID,
    status: "processed",
    analysis_status: "pending",
    analysis_error: null,
    ...overrides,
  };
}

function makeExtraction(text = "Glucosa: 123 mg/dL"): Row {
  return {
    study_id: STUDY_ID,
    user_id: USER_ID,
    extracted_text: text,
    page_count: 1,
    method: "mupdf",
  };
}

// Helper: deps con fake + Gemini + upsert grabadores
function makeDeps(init: FakeInit) {
  const supabase = createFakeSupabase(init);
  let geminiCalls = 0;
  let upsertCalls = 0;
  let geminiImpl: (text: string) => Promise<unknown> = async () =>
    VALID_ANALYSIS;

  return {
    supabase,
    geminiCalls: () => geminiCalls,
    upsertCalls: () => upsertCalls,
    setGemini: (fn: (text: string) => Promise<unknown>) => {
      geminiImpl = fn;
    },
    deps: {
      supabase: supabase as never,
      analyzeText: async (text: string) => {
        geminiCalls++;
        return (await geminiImpl(text)) as never;
      },
      upsertAnalysis: async () => {
        upsertCalls++;
      },
    },
  };
}

function assertAnalysisError(
  err: unknown,
  code: string
): asserts err is AnalysisError {
  assert.ok(err instanceof AnalysisError, `esperaba AnalysisError, recibí: ${err}`);
  assert.equal(err.code, code);
}

// ── Tests del pipeline automático (analyzeStudyWithDeps) ─────────

describe("Pipeline automático: analyzeStudyWithDeps", () => {
  it("1. estudio procesado → dispara análisis (claim ok + Gemini + upsert)", async () => {
    const h = makeDeps({
      user: { id: USER_ID },
      study: makeStudy(),
      extraction: makeExtraction(),
    });

    const result = await analyzeStudyWithDeps(STUDY_ID, h.deps);

    assert.equal(result.summary, VALID_ANALYSIS.summary);
    assert.equal(h.geminiCalls(), 1);
    assert.equal(h.upsertCalls(), 1);
    assert.equal(h.supabase.getState().studies.analysis_status, "completed");
    assert.equal(h.supabase.getState().studies.analysis_error, null);
  });

  it("2. estudio NO procesado → no dispara (study_not_ready)", async () => {
    const h = makeDeps({
      user: { id: USER_ID },
      study: makeStudy({ status: "uploaded" }),
      extraction: makeExtraction(),
    });

    await assert.rejects(
      analyzeStudyWithDeps(STUDY_ID, h.deps),
      (err) => {
        assertAnalysisError(err, "study_not_ready");
        return true;
      }
    );
    assert.equal(h.geminiCalls(), 0);
    assert.equal(h.upsertCalls(), 0);
  });

  it("3. sin extracción → no intenta Gemini (extraction_missing)", async () => {
    const h = makeDeps({
      user: { id: USER_ID },
      study: makeStudy(),
      extraction: null,
    });

    await assert.rejects(
      analyzeStudyWithDeps(STUDY_ID, h.deps),
      (err) => {
        assertAnalysisError(err, "extraction_missing");
        return true;
      }
    );
    assert.equal(h.geminiCalls(), 0);
    assert.equal(h.upsertCalls(), 0);
  });

  it("4. éxito → persiste y analysis_status='completed'", async () => {
    const h = makeDeps({
      user: { id: USER_ID },
      study: makeStudy(),
      extraction: makeExtraction(),
    });

    await analyzeStudyWithDeps(STUDY_ID, h.deps);

    assert.equal(h.upsertCalls(), 1);
    assert.equal(h.supabase.getState().studies.analysis_status, "completed");
    assert.equal(h.supabase.getState().studies.analysis_error, null);
  });

  it("5. Gemini timeout → failed, estudio disponible, sin análisis inválido", async () => {
    const h = makeDeps({
      user: { id: USER_ID },
      study: makeStudy(),
      extraction: makeExtraction(),
    });
    h.setGemini(async () => {
      throw new GeminiError("gemini_timeout", "timeout");
    });

    await assert.rejects(
      analyzeStudyWithDeps(STUDY_ID, h.deps),
      (err) => {
        assertAnalysisError(err, "gemini_timeout");
        return true;
      }
    );
    assert.equal(h.upsertCalls(), 0);
    const s = h.supabase.getState().studies;
    assert.equal(s.analysis_status, "failed");
    assert.equal(s.analysis_error, "gemini_timeout");
    // El estudio permanece procesado (no se borra nada).
    assert.equal(s.status, "processed");
  });

  it("6. network error → failed, estudio disponible", async () => {
    const h = makeDeps({
      user: { id: USER_ID },
      study: makeStudy(),
      extraction: makeExtraction(),
    });
    h.setGemini(async () => {
      throw new GeminiError("gemini_network", "network");
    });

    await assert.rejects(
      analyzeStudyWithDeps(STUDY_ID, h.deps),
      (err) => {
        assertAnalysisError(err, "gemini_network");
        return true;
      }
    );
    assert.equal(h.upsertCalls(), 0);
    const s = h.supabase.getState().studies;
    assert.equal(s.analysis_status, "failed");
    assert.equal(s.analysis_error, "gemini_network");
    assert.equal(s.status, "processed");
  });

  it("7. API error → failed, estudio disponible", async () => {
    const h = makeDeps({
      user: { id: USER_ID },
      study: makeStudy(),
      extraction: makeExtraction(),
    });
    h.setGemini(async () => {
      throw new GeminiError("gemini_api_error", "api");
    });

    await assert.rejects(
      analyzeStudyWithDeps(STUDY_ID, h.deps),
      (err) => {
        assertAnalysisError(err, "gemini_api_error");
        return true;
      }
    );
    assert.equal(h.upsertCalls(), 0);
    const s = h.supabase.getState().studies;
    assert.equal(s.analysis_status, "failed");
    assert.equal(s.analysis_error, "gemini_api_error");
  });

  it("8. respuesta inválida → no persiste, failed", async () => {
    const h = makeDeps({
      user: { id: USER_ID },
      study: makeStudy(),
      extraction: makeExtraction(),
    });
    h.setGemini(async () => {
      throw new GeminiError("gemini_invalid_response", "invalid");
    });

    await assert.rejects(
      analyzeStudyWithDeps(STUDY_ID, h.deps),
      (err) => {
        assertAnalysisError(err, "gemini_invalid_response");
        return true;
      }
    );
    assert.equal(h.upsertCalls(), 0);
    assert.equal(h.supabase.getState().studies.analysis_status, "failed");
  });

  it("10. ejecución duplicada (claim ya 'processing') → no llama a Gemini (analysis_in_progress)", async () => {
    const h = makeDeps({
      user: { id: USER_ID },
      study: makeStudy({ analysis_status: "processing" }),
      extraction: makeExtraction(),
    });

    await assert.rejects(
      analyzeStudyWithDeps(STUDY_ID, h.deps),
      (err) => {
        assertAnalysisError(err, "analysis_in_progress");
        return true;
      }
    );
    assert.equal(h.geminiCalls(), 0);
    assert.equal(h.upsertCalls(), 0);
  });

  it("11. reanálisis manual continúa (claim ok sobre 'completed')", async () => {
    const h = makeDeps({
      user: { id: USER_ID },
      study: makeStudy({ analysis_status: "completed" }),
      extraction: makeExtraction(),
    });

    const result = await analyzeStudyWithDeps(STUDY_ID, h.deps);

    // El claim pasa sobre 'completed' → reanaliza.
    assert.equal(h.geminiCalls(), 1);
    assert.equal(h.upsertCalls(), 1);
    assert.equal(result.summary, VALID_ANALYSIS.summary);
    assert.equal(h.supabase.getState().studies.analysis_status, "completed");
  });

  it("12. no autenticado → unauthenticated (no llega a Gemini)", async () => {
    const h = makeDeps({
      user: null,
      study: makeStudy(),
      extraction: makeExtraction(),
    });

    await assert.rejects(
      analyzeStudyWithDeps(STUDY_ID, h.deps),
      (err) => {
        assertAnalysisError(err, "unauthenticated");
        return true;
      }
    );
    assert.equal(h.geminiCalls(), 0);
  });

  it("13. estudio de otro usuario → study_not_found (RLS/ownership)", async () => {
    const h = makeDeps({
      user: { id: USER_ID },
      study: makeStudy({ user_id: "user-2" }),
      extraction: makeExtraction(),
    });

    await assert.rejects(
      analyzeStudyWithDeps(STUDY_ID, h.deps),
      (err) => {
        assertAnalysisError(err, "study_not_found");
        return true;
      }
    );
    assert.equal(h.geminiCalls(), 0);
  });

  it("14. error automático identificado (analysis_error con código)", async () => {
    const h = makeDeps({
      user: { id: USER_ID },
      study: makeStudy(),
      extraction: makeExtraction(),
    });
    h.setGemini(async () => {
      throw new GeminiError("gemini_timeout", "timeout");
    });

    await assert.rejects(analyzeStudyWithDeps(STUDY_ID, h.deps));

    // Se registra el código del último error para la UI (mensaje amigable).
    assert.equal(h.supabase.getState().studies.analysis_error, "gemini_timeout");
  });

  it("15. retry posterior (tras 'failed') vuelve a intentar y completa", async () => {
    // Intento 1: falla.
    const h = makeDeps({
      user: { id: USER_ID },
      study: makeStudy(),
      extraction: makeExtraction(),
    });
    let failFirst = true;
    h.setGemini(async () => {
      if (failFirst) {
        failFirst = false;
        throw new GeminiError("gemini_api_error", "api");
      }
      return VALID_ANALYSIS;
    });

    await assert.rejects(
      analyzeStudyWithDeps(STUDY_ID, h.deps),
      (err) => {
        assertAnalysisError(err, "gemini_api_error");
        return true;
      }
    );
    assert.equal(h.supabase.getState().studies.analysis_status, "failed");

    // El estudio sigue procesado → retry manual puede reanalizar.
    assert.equal(h.supabase.getState().studies.status, "processed");

    await analyzeStudyWithDeps(STUDY_ID, h.deps);
    assert.equal(h.geminiCalls(), 2);
    assert.equal(h.upsertCalls(), 1);
    assert.equal(h.supabase.getState().studies.analysis_status, "completed");
    assert.equal(h.supabase.getState().studies.analysis_error, null);
  });
});

// ── Decisión del cliente (decideAutoPipeline) ────────────────────

describe("decideAutoPipeline (cliente)", () => {
  it("9. análisis existente → 'done', NO re-ejecuta Gemini en auto", () => {
    const d = decideAutoPipeline({
      status: "processed",
      analysisStatus: "completed",
      hasAnalysis: true,
    });
    assert.deepEqual(d, { kind: "done" });
  });

  it("analysisStatus 'completed' sin fila → 'done' (idempotente)", () => {
    const d = decideAutoPipeline({
      status: "processed",
      analysisStatus: "completed",
      hasAnalysis: false,
    });
    assert.deepEqual(d, { kind: "done" });
  });

  it("procesado + pending → 'analyzing' (dispara análisis automático)", () => {
    const d = decideAutoPipeline({
      status: "processed",
      analysisStatus: "pending",
      hasAnalysis: false,
    });
    assert.deepEqual(d, { kind: "analyzing" });
  });

  it("no procesado → 'processing' (procesa primero)", () => {
    const d = decideAutoPipeline({
      status: "uploaded",
      analysisStatus: "pending",
      hasAnalysis: false,
    });
    assert.deepEqual(d, { kind: "processing" });
  });

  it("analysisStatus 'processing' → 'analyzing' con polling", () => {
    const d = decideAutoPipeline({
      status: "processed",
      analysisStatus: "processing",
      hasAnalysis: false,
    });
    assert.deepEqual(d, { kind: "analyzing" });
  });

  it("analysisStatus 'failed' → 'failed' (NO reintenta en bucle)", () => {
    const d = decideAutoPipeline({
      status: "processed",
      analysisStatus: "failed",
      hasAnalysis: false,
    });
    assert.deepEqual(d, { kind: "failed" });
  });
});
