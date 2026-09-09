import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isEvolutionReady,
  buildEvolutionUrl,
  groupStudiesByType,
} from "../history.ts";
import type { HistoryStudyRow } from "../history.ts";
import type { StudyType } from "../../studies-utils.ts";

// ── Helpers ──────────────────────────────────────────────

/** Crea una fila de estudio con defaults sensatos; `created_at` se sobreescribe por test. */
function study(
  overrides: Partial<HistoryStudyRow> & { id: string; created_at: string },
): HistoryStudyRow {
  return {
    file_name: `estudio-${overrides.id}.pdf`,
    study_type: "blood_test",
    status: "processed",
    analysis_status: "completed",
    file_size: 1024,
    ...overrides,
  };
}

const READY = { status: "processed", analysis_status: "completed" };

// ── isEvolutionReady ─────────────────────────────────────

describe("isEvolutionReady", () => {
  it("processed + completed → true", () => {
    assert.equal(isEvolutionReady("processed", "completed"), true);
  });

  it("processing + completed → false (aún procesando)", () => {
    assert.equal(isEvolutionReady("processing", "completed"), false);
  });

  it("processed + pending → false (análisis incompleto)", () => {
    assert.equal(isEvolutionReady("processed", "pending"), false);
  });

  it("processed + processing → false", () => {
    assert.equal(isEvolutionReady("processed", "processing"), false);
  });

  it("processed + failed → false", () => {
    assert.equal(isEvolutionReady("processed", "failed"), false);
  });

  it("uploaded + completed → false (nunca subido/procesado)", () => {
    assert.equal(isEvolutionReady("uploaded", "completed"), false);
  });

  it("error + completed → false", () => {
    assert.equal(isEvolutionReady("error", "completed"), false);
  });
});

// ── buildEvolutionUrl ────────────────────────────────────

describe("buildEvolutionUrl", () => {
  it("un solo id → query con ese id", () => {
    assert.equal(buildEvolutionUrl(["a1"]), "/dashboard/evolucion?ids=a1");
  });

  it("varios ids → separados por coma", () => {
    assert.equal(
      buildEvolutionUrl(["a1", "b2", "c3"]),
      "/dashboard/evolucion?ids=a1,b2,c3",
    );
  });

  it("ids vacíos → query vacía (sin comas residuales)", () => {
    assert.equal(buildEvolutionUrl([]), "/dashboard/evolucion?ids=");
  });
});

// ── groupStudiesByType ───────────────────────────────────

describe("groupStudiesByType", () => {
  it("lista vacía → sin grupos", () => {
    assert.deepEqual(groupStudiesByType([]), []);
  });

  it("un solo estudio → un grupo, sin canEvolve", () => {
    const groups = groupStudiesByType([study({ id: "s1", created_at: "2026-09-01T10:00:00Z" })]);

    assert.equal(groups.length, 1);
    assert.equal(groups[0].studyType, "blood_test");
    assert.equal(groups[0].label, "Análisis de sangre");
    assert.equal(groups[0].readyCount, 1);
    assert.equal(groups[0].canEvolve, false);
    assert.equal(groups[0].evolutionUrl, null);
  });

  it("dos del mismo tipo, ambos ready → canEvolve y URL con ambos ids", () => {
    const groups = groupStudiesByType([
      study({ id: "a1", created_at: "2026-08-01T10:00:00Z" }),
      study({ id: "b2", created_at: "2026-09-01T10:00:00Z" }),
    ]);

    assert.equal(groups.length, 1);
    assert.equal(groups[0].canEvolve, true);
    assert.equal(groups[0].readyCount, 2);
    assert.equal(
      groups[0].evolutionUrl,
      "/dashboard/evolucion?ids=a1,b2",
    );
  });

  it("dos del mismo tipo, solo uno ready → sin canEvolve", () => {
    const groups = groupStudiesByType([
      study({ id: "a1", created_at: "2026-08-01T10:00:00Z" }),
      study({
        id: "b2",
        created_at: "2026-09-01T10:00:00Z",
        analysis_status: "pending",
      }),
    ]);

    assert.equal(groups.length, 1);
    assert.equal(groups[0].readyCount, 1);
    assert.equal(groups[0].canEvolve, false);
    assert.equal(groups[0].evolutionUrl, null);
  });

  it("estudios sin tipo (null) → grupo 'Pendiente de análisis' sin canEvolve", () => {
    const groups = groupStudiesByType([
      study({ id: "n1", created_at: "2026-09-01T10:00:00Z", study_type: null }),
      study({ id: "n2", created_at: "2026-09-02T10:00:00Z", study_type: null }),
    ]);

    assert.equal(groups.length, 1);
    assert.equal(groups[0].studyType, null);
    assert.equal(groups[0].label, "Pendiente de análisis");
    assert.equal(groups[0].readyCount, 2);
    assert.equal(groups[0].canEvolve, false);
    assert.equal(groups[0].evolutionUrl, null);
  });

  it("tipos distintos → grupos separados con sus labels", () => {
    const groups = groupStudiesByType([
      study({ id: "m1", created_at: "2026-08-01T10:00:00Z", study_type: "MRI" }),
      study({ id: "b1", created_at: "2026-09-01T10:00:00Z", study_type: "blood_test" }),
    ]);

    const labels = groups.map((g) => g.label);
    assert.deepEqual(labels, ["Análisis de sangre", "Resonancia magnética"]);
  });

  it("dentro del grupo: orden cronológico ASC (más antiguo primero)", () => {
    const groups = groupStudiesByType([
      study({ id: "late", created_at: "2026-09-01T10:00:00Z" }),
      study({ id: "early", created_at: "2026-08-01T10:00:00Z" }),
      study({ id: "mid", created_at: "2026-08-15T10:00:00Z" }),
    ]);

    const ids = groups[0].studies.map((s) => s.id);
    assert.deepEqual(ids, ["early", "mid", "late"]);
  });

  it("entre grupos: más reciente primero (por max created_at)", () => {
    const groups = groupStudiesByType([
      // MRI: más reciente → 2026-09-10
      study({ id: "m1", created_at: "2026-08-01T10:00:00Z", study_type: "MRI" }),
      study({ id: "m2", created_at: "2026-09-10T10:00:00Z", study_type: "MRI" }),
      // blood_test: más reciente → 2026-09-01
      study({ id: "b1", created_at: "2026-08-01T10:00:00Z", study_type: "blood_test" }),
      study({ id: "b2", created_at: "2026-09-01T10:00:00Z", study_type: "blood_test" }),
    ]);

    assert.deepEqual(
      groups.map((g) => g.studyType),
      ["MRI", "blood_test"],
    );
  });

  it("grupo null siempre al final, incluso si es el más reciente", () => {
    const groups = groupStudiesByType([
      study({ id: "n1", created_at: "2026-09-20T10:00:00Z", study_type: null }),
      study({ id: "b1", created_at: "2026-09-01T10:00:00Z", study_type: "blood_test" }),
      study({ id: "b2", created_at: "2026-08-01T10:00:00Z", study_type: "blood_test" }),
    ]);

    assert.equal(groups.length, 2);
    assert.equal(groups[0].studyType, "blood_test");
    assert.equal(groups[1].studyType, null);
  });

  it("readyCount cuenta solo estudios ready mezclando estados", () => {
    const groups = groupStudiesByType([
      study({ id: "r1", created_at: "2026-09-01T10:00:00Z", ...READY }),
      study({
        id: "r2",
        created_at: "2026-09-02T10:00:00Z",
        ...READY,
      }),
      study({
        id: "p1",
        created_at: "2026-09-03T10:00:00Z",
        analysis_status: "pending",
      }),
      study({
        id: "e1",
        created_at: "2026-09-04T10:00:00Z",
        status: "error",
      }),
    ]);

    assert.equal(groups[0].readyCount, 2);
    assert.equal(groups[0].canEvolve, true);
  });

  it("evolutionUrl contiene SOLO los ids ready, en orden cronológico", () => {
    // Mezclados en input: el id ready más antiguo es "old", el reciente "new".
    const groups = groupStudiesByType([
      study({ id: "new", created_at: "2026-09-10T10:00:00Z", ...READY }),
      study({
        id: "pending",
        created_at: "2026-09-05T10:00:00Z",
        analysis_status: "pending",
      }),
      study({ id: "old", created_at: "2026-08-01T10:00:00Z", ...READY }),
    ]);

    assert.equal(groups[0].canEvolve, true);
    assert.equal(groups[0].evolutionUrl, "/dashboard/evolucion?ids=old,new");
  });

  it("tres ready → evolutionUrl con los tres ids", () => {
    const groups = groupStudiesByType([
      study({ id: "a", created_at: "2026-08-01T10:00:00Z", ...READY }),
      study({ id: "b", created_at: "2026-08-02T10:00:00Z", ...READY }),
      study({ id: "c", created_at: "2026-08-03T10:00:00Z", ...READY }),
    ]);

    assert.equal(groups[0].canEvolve, true);
    assert.equal(groups[0].evolutionUrl, "/dashboard/evolucion?ids=a,b,c");
  });

  it("no muta el arreglo de entrada", () => {
    const input = [
      study({ id: "late", created_at: "2026-09-01T10:00:00Z" }),
      study({ id: "early", created_at: "2026-08-01T10:00:00Z" }),
    ];
    const original = input.map((s) => ({ ...s }));

    groupStudiesByType(input);

    assert.deepEqual(input, original);
  });

  it("fechas iguales mantienen estabilidad (no crashea)", () => {
    const groups = groupStudiesByType([
      study({ id: "x", created_at: "2026-09-01T10:00:00Z", ...READY }),
      study({ id: "y", created_at: "2026-09-01T10:00:00Z", ...READY }),
    ]);

    assert.equal(groups[0].readyCount, 2);
    assert.equal(groups[0].canEvolve, true);
  });

  it("fechas iguales → orden determinista por id (Fase 10.7)", () => {
    // Independiente del orden de entrada: [zz, aa, mm] y [aa, zz, mm]
    // deben producir el mismo orden de miembros y la misma evolutionUrl.
    const row = (id: string) =>
      study({ id, created_at: "2026-09-01T10:00:00Z", ...READY });

    const g1 = groupStudiesByType([row("zz"), row("aa"), row("mm")]);
    const g2 = groupStudiesByType([row("aa"), row("zz"), row("mm")]);

    assert.deepEqual(
      g1[0].studies.map((s) => s.id),
      ["aa", "mm", "zz"],
    );
    assert.deepEqual(
      g2[0].studies.map((s) => s.id),
      ["aa", "mm", "zz"],
    );
    assert.equal(g1[0].evolutionUrl, "/dashboard/evolucion?ids=aa,mm,zz");
    assert.equal(g2[0].evolutionUrl, "/dashboard/evolucion?ids=aa,mm,zz");
  });

  it("exposición de cada tipo de estudio conocido produce su label", () => {
    const types: StudyType[] = [
      "blood_test",
      "MRI",
      "CT",
      "ECG",
      "epicrisis",
      "medical_report",
      "other",
    ];

    for (const t of types) {
      const groups = groupStudiesByType([
        study({ id: `s-${t}`, created_at: "2026-09-01T10:00:00Z", study_type: t }),
      ]);
      assert.equal(groups[0].studyType, t);
      assert.notEqual(groups[0].label, "Pendiente de análisis", `label por defecto para ${t}`);
    }
  });
});