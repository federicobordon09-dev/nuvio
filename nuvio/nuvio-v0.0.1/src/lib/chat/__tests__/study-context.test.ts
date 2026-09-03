import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  ChatError,
  listSelectableStudiesCore,
  assertStudyReadyCore,
  getConversationTitleFromStudyCore,
  loadContextForPromptCore,
  MAX_CONTEXT_EXTRACTION_CHARS,
} from "../study-context.ts";
import { createFakeSupabase } from "./fake-supabase.ts";

const USER_ID = "user-1";
const CONV_ID = "conv-1";

const READY_STUDY = {
  id: "s1",
  user_id: USER_ID,
  file_name: "analisis.pdf",
  study_type: "blood_test",
  status: "processed",
  analysis_status: "completed",
};

const NOT_READY_STUDY = {
  id: "s2",
  user_id: USER_ID,
  file_name: "pendiente.pdf",
  study_type: "MRI",
  status: "processed",
  analysis_status: "pending",
};

const ANALYSIS_ROW = {
  id: "a1",
  study_id: "s1",
  user_id: USER_ID,
  analysis: {
    summary: "Glucosa elevada.",
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
    observations: [],
    warnings: [],
    recommendations: [],
    limitations: [],
  },
};

function assertChatError(err: unknown, code: string): asserts err is ChatError {
  assert.ok(err instanceof ChatError, `esperaba ChatError, recibí: ${err}`);
  assert.equal(err.code, code);
}

describe("listSelectableStudiesCore", () => {
  it("devuelve solo estudios en stage ready", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      tables: {
        studies: [READY_STUDY, NOT_READY_STUDY],
      },
    });
    const list = await listSelectableStudiesCore(fake as never, USER_ID);
    assert.equal(list.length, 1);
    assert.equal(list[0].id, "s1");
  });

  it("no incluye estudios de otro usuario", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      tables: {
        studies: [{ ...READY_STUDY, id: "s3", user_id: "user-2" }],
      },
    });
    const list = await listSelectableStudiesCore(fake as never, USER_ID);
    assert.equal(list.length, 0);
  });
});

describe("assertStudyReadyCore", () => {
  it("estudio propio y listo → pasa", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      tables: { studies: [READY_STUDY] },
    });
    await assertStudyReadyCore(fake as never, USER_ID, "s1");
  });

  it("estudio no listo → study_not_ready", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      tables: { studies: [NOT_READY_STUDY] },
    });
    await assert.rejects(
      () => assertStudyReadyCore(fake as never, USER_ID, "s2"),
      (err) => {
        assertChatError(err, "study_not_ready");
        return true;
      }
    );
  });

  it("estudio inexistente o de otro usuario → study_not_found", async () => {
    const fake = createFakeSupabase({ user: { id: USER_ID }, tables: {} });
    await assert.rejects(
      () => assertStudyReadyCore(fake as never, USER_ID, "missing"),
      (err) => {
        assertChatError(err, "study_not_found");
        return true;
      }
    );
  });
});

describe("loadContextForPromptCore", () => {
  it("arma el contexto con análisis y texto extraído", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      tables: {
        chat_contexts: [{ id: "x1", conversation_id: CONV_ID, study_id: "s1", user_id: USER_ID }],
        studies: [READY_STUDY],
        study_analyses: [ANALYSIS_ROW],
        study_extractions: [
          { study_id: "s1", user_id: USER_ID, extracted_text: "Glucosa: 123 mg/dL" },
        ],
      },
    });
    const contexts = await loadContextForPromptCore(fake as never, USER_ID, CONV_ID);
    assert.equal(contexts.length, 1);
    assert.equal(contexts[0].studyId, "s1");
    assert.equal(contexts[0].analysis.summary, "Glucosa elevada.");
    assert.equal(contexts[0].extractedText, "Glucosa: 123 mg/dL");
  });

  it("ignora estudios no listos en el contexto", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      tables: {
        chat_contexts: [
          { id: "x1", conversation_id: CONV_ID, study_id: "s1", user_id: USER_ID },
          { id: "x2", conversation_id: CONV_ID, study_id: "s2", user_id: USER_ID },
        ],
        studies: [READY_STUDY, NOT_READY_STUDY],
        study_analyses: [ANALYSIS_ROW],
        study_extractions: [
          { study_id: "s1", user_id: USER_ID, extracted_text: "texto" },
        ],
      },
    });
    const contexts = await loadContextForPromptCore(fake as never, USER_ID, CONV_ID);
    assert.equal(contexts.length, 1);
    assert.equal(contexts[0].studyId, "s1");
  });

  it("sin contexto → lista vacía", async () => {
    const fake = createFakeSupabase({ user: { id: USER_ID }, tables: {} });
    const contexts = await loadContextForPromptCore(fake as never, USER_ID, CONV_ID);
    assert.equal(contexts.length, 0);
  });

  it("recorta el texto extraído al límite", async () => {
    const longText = "x".repeat(MAX_CONTEXT_EXTRACTION_CHARS + 5000);
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      tables: {
        chat_contexts: [{ id: "x1", conversation_id: CONV_ID, study_id: "s1", user_id: USER_ID }],
        studies: [READY_STUDY],
        study_analyses: [ANALYSIS_ROW],
        study_extractions: [{ study_id: "s1", user_id: USER_ID, extracted_text: longText }],
      },
    });
    const contexts = await loadContextForPromptCore(fake as never, USER_ID, CONV_ID);
    assert.equal(contexts.length, 1);
    assert.ok(contexts[0].extractedText.length <= MAX_CONTEXT_EXTRACTION_CHARS + 25);
    assert.ok(contexts[0].extractedText.includes("[contenido truncado]"));
  });
});

// ── getConversationTitleFromStudyCore ─────────────────────────

describe("getConversationTitleFromStudyCore", () => {
  it("devuelve el label del study_type cuando el estudio es válido y propio", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      tables: { studies: [READY_STUDY] }, // study_type: "blood_test"
    });
    const title = await getConversationTitleFromStudyCore(fake as never, USER_ID, "s1");
    assert.equal(title, "Análisis de sangre");
  });

  it("devuelve el label correcto para otro tipo de estudio", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      tables: { studies: [{ ...READY_STUDY, id: "s2", study_type: "MRI" }] },
    });
    const title = await getConversationTitleFromStudyCore(fake as never, USER_ID, "s2");
    assert.equal(title, "Resonancia magnética");
  });

  it("devuelve null cuando el estudio no existe", async () => {
    const fake = createFakeSupabase({ user: { id: USER_ID }, tables: {} });
    const title = await getConversationTitleFromStudyCore(fake as never, USER_ID, "missing");
    assert.equal(title, null);
  });

  it("devuelve null cuando el estudio pertenece a otro usuario (ownership)", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      tables: { studies: [{ ...READY_STUDY, user_id: "user-2" }] },
    });
    const title = await getConversationTitleFromStudyCore(fake as never, USER_ID, "s1");
    assert.equal(title, null);
  });

  it("devuelve null cuando study_type está vacío", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      tables: { studies: [{ ...READY_STUDY, study_type: "" }] },
    });
    const title = await getConversationTitleFromStudyCore(fake as never, USER_ID, "s1");
    assert.equal(title, null);
  });
});
