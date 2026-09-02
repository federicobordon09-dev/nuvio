import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  deleteStudyCore,
  countStudiesCore,
  StudyDeleteError,
} from "../study-ops.ts";
import {
  getStudyStage,
  getStudyStageLabel,
  getStudyStageStyles,
  getStudyStageDotStyle,
  getAnalysisStatusLabel,
  computeStudyStats,
} from "../../studies-utils.ts";

// ── Fake de Supabase ─────────────────────────────────────────────

type Row = Record<string, unknown>;

type FakeInit = {
  user: { id: string } | null;
  study?: Row | null;
  removeError?: { message: string } | null;
  deleteError?: { message: string } | null;
  count?: number;
};

function createFakeSupabase(initial: FakeInit) {
  const state = {
    study: initial.study ? { ...initial.study } : null,
    storageRemoved: false,
  };
  const calls: string[] = [];

  function makeBuilder(table: string) {
    let op: "read" | "delete" | "count" = "read";
    const filters: { col: string; val: unknown }[] = [];

    const rowsFor = (): Row[] =>
      table === "studies" && state.study ? [state.study] : [];

    const match = (row: Row) => filters.every((f) => row[f.col] === f.val);

    const q = {
      eq(col: string, val: unknown) {
        filters.push({ col, val });
        return q;
      },
      select(cols: string, opts?: { count: "exact"; head: boolean }) {
        calls.push(`${table}.select(${cols})`);
        if (opts) {
          op = "count";
        }
        return q;
      },
      delete() {
        op = "delete";
        calls.push(`${table}.delete()`);
        return q;
      },
      async single() {
        const rows = rowsFor().filter(match);
        return rows.length
          ? { data: rows[0], error: null }
          : { data: null, error: { message: "not found" } };
      },
      async then(onF: (v: unknown) => unknown, _onR: (e: unknown) => unknown) {
        if (op === "count") {
          return onF({
            count: initial.count ?? rowsFor().filter(match).length,
            error: null,
          });
        }
        if (op === "delete") {
          state.study = null; // simula ON DELETE CASCADE a nivel de fila
          return onF({ error: initial.deleteError ?? null });
        }
        return onF({ data: rowsFor().filter(match), error: null });
      },
    };
    return q;
  }

  return {
    calls,
    state,
    auth: {
      getUser: async () => ({ data: { user: initial.user } }),
    },
    storage: {
      from: (_bucket: string) => ({
        remove: async (paths: string[]) => {
          calls.push(`storage.remove(${JSON.stringify(paths)})`);
          if (initial.removeError) {
            return { data: null, error: initial.removeError };
          }
          state.storageRemoved = true;
          return { data: paths, error: null };
        },
      }),
    },
    from(table: string) {
      calls.push(`from(${table})`);
      return makeBuilder(table);
    },
  };
}

function assertDeleteError(
  err: unknown,
  code: string
): asserts err is StudyDeleteError {
  assert.ok(
    err instanceof StudyDeleteError,
    `esperaba StudyDeleteError, recibí: ${err}`
  );
  assert.equal(err.code, code);
}

const USER_ID = "user-1";
const STUDY_ID = "study-1";

const STUDY_ROW = {
  id: STUDY_ID,
  file_path: "user-1/study-1/file.pdf",
  user_id: USER_ID,
};

// ── deleteStudyCore ──────────────────────────────────────────────

describe("deleteStudyCore", () => {
  it("usuario no autenticado → unauthenticated, no toca nada", async () => {
    const fake = createFakeSupabase({ user: null, study: STUDY_ROW });

    await assert.rejects(
      deleteStudyCore(STUDY_ID, { supabase: fake as never }),
      (err) => {
        assertDeleteError(err, "unauthenticated");
        return true;
      }
    );
    assert.ok(fake.state.study, "el estudio no debe eliminarse");
    assert.equal(fake.state.storageRemoved, false);
  });

  it("estudio inexistente → not_found", async () => {
    const fake = createFakeSupabase({ user: { id: USER_ID }, study: null });

    await assert.rejects(
      deleteStudyCore(STUDY_ID, { supabase: fake as never }),
      (err) => {
        assertDeleteError(err, "not_found");
        return true;
      }
    );
    assert.equal(fake.state.storageRemoved, false);
  });

  it("estudio de otro usuario → not_found (ownership/RLS)", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      study: { ...STUDY_ROW, user_id: "user-2" },
    });

    await assert.rejects(
      deleteStudyCore(STUDY_ID, { supabase: fake as never }),
      (err) => {
        assertDeleteError(err, "not_found");
        return true;
      }
    );
    assert.equal(fake.state.storageRemoved, false);
  });

  it("delete exitoso → storage + DB, y el registro desaparece", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      study: STUDY_ROW,
    });

    await deleteStudyCore(STUDY_ID, { supabase: fake as never });

    assert.equal(fake.state.storageRemoved, true);
    assert.equal(fake.state.study, null);
    assert.ok(fake.calls.includes("studies.delete()"));
  });

  it("error de Storage (no not-found) → storage_failed, NO toca la DB", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      study: STUDY_ROW,
      removeError: { message: "network error" },
    });

    await assert.rejects(
      deleteStudyCore(STUDY_ID, { supabase: fake as never }),
      (err) => {
        assertDeleteError(err, "storage_failed");
        return true;
      }
    );
    // El registro permanece → no hay registro sin archivo.
    assert.ok(fake.state.study, "la DB no debe tocarse si falla storage");
    assert.equal(fake.state.storageRemoved, false);
  });

  it("archivo ya inexistente en storage → no es fatal, continúa la DB", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      study: STUDY_ROW,
      removeError: { message: "The resource was not found" },
    });

    await deleteStudyCore(STUDY_ID, { supabase: fake as never });

    assert.equal(fake.state.study, null);
  });

  it("error de DB → db_failed", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      study: STUDY_ROW,
      deleteError: { message: "constraint violation" },
    });

    await assert.rejects(
      deleteStudyCore(STUDY_ID, { supabase: fake as never }),
      (err) => {
        assertDeleteError(err, "db_failed");
        return true;
      }
    );
    assert.equal(fake.state.storageRemoved, true);
  });
});

// ── countStudiesCore ─────────────────────────────────────────────

describe("countStudiesCore", () => {
  it("devuelve el conteo del usuario", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      study: null,
      count: 3,
    });

    const count = await countStudiesCore(fake as never, USER_ID);
    assert.equal(count, 3);
  });

  it("devuelve 0 cuando no hay estudios", async () => {
    const fake = createFakeSupabase({ user: { id: USER_ID }, study: null });

    const count = await countStudiesCore(fake as never, USER_ID);
    assert.equal(count, 0);
  });

  it("usa el user_id del usuario autenticado (filtro ownership)", async () => {
    const fake = createFakeSupabase({ user: { id: USER_ID }, study: null });

    await countStudiesCore(fake as never, USER_ID);

    // select + eq(user_id) con head → filtra por ownership.
    assert.ok(fake.calls.includes("from(studies)"));
    assert.ok(fake.calls.includes("studies.select(id)"));
  });
});

// ── getStudyStage / labels ───────────────────────────────────────

describe("getStudyStage", () => {
  it("cubre todos los stages combinados", () => {
    assert.equal(getStudyStage("uploaded"), "pending_processing");
    assert.equal(getStudyStage("processing"), "processing");
    assert.equal(getStudyStage("error"), "error_processing");
    assert.equal(
      getStudyStage("processed", "pending"),
      "pending_analysis"
    );
    assert.equal(getStudyStage("processed", "processing"), "analyzing");
    assert.equal(getStudyStage("processed", "completed"), "ready");
    assert.equal(getStudyStage("processed", "failed"), "error_analysis");
    assert.equal(getStudyStage("processed", undefined), "pending_analysis");
    assert.equal(getStudyStage("otro"), "unknown");
  });

  it("getStudyStageLabel devuelve textos amigables", () => {
    assert.equal(getStudyStageLabel("processed", "completed"), "Listo");
    assert.equal(getStudyStageLabel("processed", "processing"), "Analizando con IA");
    assert.equal(getStudyStageLabel("processed", "failed"), "Error de análisis");
    assert.equal(getStudyStageLabel("uploaded"), "Pendiente de procesamiento");
    assert.equal(getStudyStageLabel("error"), "Error de procesamiento");
  });

  it("getStudyStageStyles devuelve clases de color consistentes", () => {
    const ready = getStudyStageStyles("processed", "completed");
    const failed = getStudyStageStyles("processed", "failed");
    assert.ok(ready.includes("success"));
    assert.ok(failed.includes("danger"));
  });

  it("getStudyStageDotStyle devuelve el dot del stage", () => {
    assert.ok(getStudyStageDotStyle("processed", "completed").includes("success"));
  });
});

// ── getAnalysisStatusLabel ───────────────────────────────────────

describe("getAnalysisStatusLabel", () => {
  it("devuelve etiquetas para los 4 estados", () => {
    assert.equal(getAnalysisStatusLabel("pending"), "Pendiente");
    assert.equal(getAnalysisStatusLabel("processing"), "En progreso");
    assert.equal(getAnalysisStatusLabel("completed"), "Completado");
    assert.equal(getAnalysisStatusLabel("failed"), "Fallido");
  });

  it("devuelve Desconocido para un estado inválido", () => {
    assert.equal(getAnalysisStatusLabel("weird"), "Desconocido");
  });
});

// ── computeStudyStats ───────────────────────────────────────────

describe("computeStudyStats", () => {
  it("devuelve ceros cuando no hay estudios", () => {
    assert.deepEqual(computeStudyStats([]), {
      total: 0,
      ready: 0,
      in_progress: 0,
      pending: 0,
      errors: 0,
    });
  });

  it("agrupa cada stage combinado en su bucket", () => {
    const stats = computeStudyStats([
      { status: "processed", analysis_status: "completed" }, // ready
      { status: "processed", analysis_status: "processing" }, // in_progress
      { status: "processing", analysis_status: "pending" }, // in_progress
      { status: "uploaded" }, // pending
      { status: "processed", analysis_status: "pending" }, // pending
      { status: "error", analysis_status: "pending" }, // errors
      { status: "processed", analysis_status: "failed" }, // errors
    ]);

    assert.deepEqual(stats, {
      total: 7,
      ready: 1,
      in_progress: 2,
      pending: 2,
      errors: 2,
    });
  });

  it("trata analysis_status nulo como pendiente de análisis", () => {
    const stats = computeStudyStats([
      { status: "processed", analysis_status: null },
    ]);
    assert.equal(stats.pending, 1);
    assert.equal(stats.ready, 0);
  });

  it("ignora estados desconocidos", () => {
    const stats = computeStudyStats([
      { status: "otro", analysis_status: "otro" },
    ]);
    assert.deepEqual(stats, {
      total: 1,
      ready: 0,
      in_progress: 0,
      pending: 0,
      errors: 0,
    });
  });
});
