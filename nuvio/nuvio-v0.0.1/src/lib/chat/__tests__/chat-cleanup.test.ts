import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  findConversationsForStudyCore,
  cleanupConversationsForDeletedStudyCore,
} from "../chat-db.ts";
import { createFakeSupabase, type FakeSupabase } from "./fake-supabase.ts";

const USER = "user-1";
const OTHER = "user-2";
const DELETED_STUDY = "study-deleted";

/**
 * Helper: crea un fake Supabase con el esquema completo de chat.
 *
 * El estado debe reflejar la situación DESPUÉS de deleteStudyCore + CASCADE:
 * los chat_contexts del estudio eliminado ya no existen.
 */
function fakeChatDb(
  conversations: Array<{ id: string; user_id: string }> = [],
  contexts: Array<{ id: string; conversation_id: string; study_id: string; user_id: string }> = [],
  messages: Array<{ id: string; conversation_id: string; user_id: string }> = []
): FakeSupabase {
  return createFakeSupabase({
    user: { id: USER },
    tables: {
      chat_conversations: conversations,
      chat_contexts: contexts,
      chat_messages: messages,
    },
  });
}

// ══════════════════════════════════════════════════════════════════
// Caso A: Conversación con un solo estudio, 0 mensajes → se elimina
// ══════════════════════════════════════════════════════════════════

describe("Caso A — conversación con un solo estudio, sin mensajes", () => {
  it("conversación con 0 contextos restantes y 0 mensajes → eliminada", async () => {
    // findConversationsForStudyCore corre ANTES de CASCADE.
    // Preparamos chat_contexts con el estudio que será borrado.
    const preFake = createFakeSupabase({
      user: { id: USER },
      tables: {
        chat_conversations: [{ id: "conv-1", user_id: USER }],
        chat_contexts: [
          { id: "ctx-1", conversation_id: "conv-1", study_id: DELETED_STUDY, user_id: USER },
        ],
        chat_messages: [],
      },
    });

    const convIds = await findConversationsForStudyCore(
      preFake as never,
      USER,
      DELETED_STUDY
    );
    assert.deepEqual(convIds, ["conv-1"]);

    // Después de deleteStudyCore + CASCADE: chat_contexts del estudio eliminado ya no existen.
    const postFake = fakeChatDb(
      [{ id: "conv-1", user_id: USER }],
      [], // 0 contextos (CASCADE limpió los del estudio borrado)
      []  // 0 mensajes
    );

    const deleted = await cleanupConversationsForDeletedStudyCore(
      postFake as never,
      USER,
      convIds
    );
    assert.equal(deleted, 1);

    const remaining = postFake.tables.get("chat_conversations") ?? [];
    assert.equal(remaining.length, 0);
  });
});

// ══════════════════════════════════════════════════════════════════
// Caso B: Conversación con un solo estudio, CON mensajes → se elimina
// (NUEVA comportamiento: antes se preservaba por tener mensajes)
// ══════════════════════════════════════════════════════════════════

describe("Caso B — conversación con un solo estudio, con mensajes", () => {
  it("conversación con 0 contextos restantes y 3 mensajes → eliminada", async () => {
    const preFake = createFakeSupabase({
      user: { id: USER },
      tables: {
        chat_conversations: [{ id: "conv-1", user_id: USER }],
        chat_contexts: [
          { id: "ctx-1", conversation_id: "conv-1", study_id: DELETED_STUDY, user_id: USER },
        ],
        chat_messages: [
          { id: "msg-1", conversation_id: "conv-1", user_id: USER },
          { id: "msg-2", conversation_id: "conv-1", user_id: USER },
          { id: "msg-3", conversation_id: "conv-1", user_id: USER },
        ],
      },
    });

    const convIds = await findConversationsForStudyCore(
      preFake as never,
      USER,
      DELETED_STUDY
    );
    assert.deepEqual(convIds, ["conv-1"]);

    // Después de CASCADE: contextos eliminados, mensajes persisten
    const postFake = fakeChatDb(
      [{ id: "conv-1", user_id: USER }],
      [], // 0 contextos
      [
        { id: "msg-1", conversation_id: "conv-1", user_id: USER },
        { id: "msg-2", conversation_id: "conv-1", user_id: USER },
        { id: "msg-3", conversation_id: "conv-1", user_id: USER },
      ]
    );

    const deleted = await cleanupConversationsForDeletedStudyCore(
      postFake as never,
      USER,
      convIds
    );
    assert.equal(deleted, 1); // SE ELIMINA aunque tenga mensajes

    const remaining = postFake.tables.get("chat_conversations") ?? [];
    assert.equal(remaining.length, 0);
  });
});

// ══════════════════════════════════════════════════════════════════
// Caso C: Conversación con múltiples estudios, uno eliminado → se conserva
// ══════════════════════════════════════════════════════════════════

describe("Caso C — conversación multi-estudio, queda 1 tras borrado", () => {
  it("conversación con 1 contexto restante → preservada", async () => {
    const preFake = createFakeSupabase({
      user: { id: USER },
      tables: {
        chat_conversations: [{ id: "conv-1", user_id: USER }],
        chat_contexts: [
          { id: "ctx-del", conversation_id: "conv-1", study_id: DELETED_STUDY, user_id: USER },
          { id: "ctx-ok", conversation_id: "conv-1", study_id: "study-remaining", user_id: USER },
        ],
        chat_messages: [],
      },
    });

    const convIds = await findConversationsForStudyCore(
      preFake as never,
      USER,
      DELETED_STUDY
    );
    assert.deepEqual(convIds, ["conv-1"]);

    // Después de CASCADE: solo el contexto del estudio borrado fue eliminado
    const postFake = fakeChatDb(
      [{ id: "conv-1", user_id: USER }],
      [{ id: "ctx-ok", conversation_id: "conv-1", study_id: "study-remaining", user_id: USER }],
      []
    );

    const deleted = await cleanupConversationsForDeletedStudyCore(
      postFake as never,
      USER,
      convIds
    );
    assert.equal(deleted, 0); // Se conserva

    const remaining = postFake.tables.get("chat_conversations") ?? [];
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].id, "conv-1");
  });
});

// ══════════════════════════════════════════════════════════════════
// Caso D: Conversación asociada a un estudio diferente → no afectada
// ══════════════════════════════════════════════════════════════════

describe("Caso D — conversación de otro estudio no se ve afectada", () => {
  it("conversación con estudio diferente → no aparece en afectadas", async () => {
    const preFake = createFakeSupabase({
      user: { id: USER },
      tables: {
        chat_conversations: [{ id: "conv-other", user_id: USER }],
        chat_contexts: [
          { id: "ctx-1", conversation_id: "conv-other", study_id: "study-other", user_id: USER },
        ],
        chat_messages: [],
      },
    });

    const convIds = await findConversationsForStudyCore(
      preFake as never,
      USER,
      DELETED_STUDY
    );
    assert.deepEqual(convIds, []); // No hay conversaciones afectadas

    const deleted = await cleanupConversationsForDeletedStudyCore(
      preFake as never,
      USER,
      convIds
    );
    assert.equal(deleted, 0);

    const remaining = preFake.tables.get("chat_conversations") ?? [];
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].id, "conv-other");
  });
});

// ══════════════════════════════════════════════════════════════════
// Caso E: Aislamiento cross-user
// ══════════════════════════════════════════════════════════════════

describe("Caso E — aislamiento cross-user", () => {
  it("conversaciones de otro usuario NUNCA se eliminan", async () => {
    const preFake = createFakeSupabase({
      user: { id: USER },
      tables: {
        chat_conversations: [
          { id: "conv-mine", user_id: USER },
          { id: "conv-other", user_id: OTHER },
        ],
        chat_contexts: [
          { id: "ctx-mine", conversation_id: "conv-mine", study_id: DELETED_STUDY, user_id: USER },
          { id: "ctx-other", conversation_id: "conv-other", study_id: DELETED_STUDY, user_id: OTHER },
        ],
        chat_messages: [],
      },
    });

    const convIds = await findConversationsForStudyCore(
      preFake as never,
      USER,
      DELETED_STUDY
    );
    // Solo las conversaciones del usuario actual
    assert.deepEqual(convIds, ["conv-mine"]);

    // Después de CASCADE
    const postFake = fakeChatDb(
      [
        { id: "conv-mine", user_id: USER },
        { id: "conv-other", user_id: OTHER },
      ],
      [], // 0 contextos
      []
    );

    const deleted = await cleanupConversationsForDeletedStudyCore(
      postFake as never,
      USER,
      convIds
    );
    assert.equal(deleted, 1); // Solo la mía

    const remaining = postFake.tables.get("chat_conversations") ?? [];
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].id, "conv-other"); // La del otro usuario sigue
  });
});

// ══════════════════════════════════════════════════════════════════
// Caso F: Estudio sin conversaciones asociadas
// ══════════════════════════════════════════════════════════════════

describe("Caso F — estudio sin conversaciones (no hay nada que limpiar)", () => {
  it("findConversationsForStudyCore retorna [] → cleanup retorna 0", async () => {
    const preFake = createFakeSupabase({
      user: { id: USER },
      tables: {
        chat_conversations: [],
        chat_contexts: [],
        chat_messages: [],
      },
    });

    const convIds = await findConversationsForStudyCore(
      preFake as never,
      USER,
      DELETED_STUDY
    );
    assert.deepEqual(convIds, []);

    const postFake = fakeChatDb([], [], []);
    const deleted = await cleanupConversationsForDeletedStudyCore(
      postFake as never,
      USER,
      convIds
    );
    assert.equal(deleted, 0);
  });
});

// ══════════════════════════════════════════════════════════════════
// Caso G: Idempotencia
// ══════════════════════════════════════════════════════════════════

describe("Caso G — idempotencia", () => {
  it("llamar cleanup dos veces con los mismos IDs no causa error", async () => {
    const postFake = fakeChatDb(
      [{ id: "conv-1", user_id: USER }],
      [],
      []
    );

    const d1 = await cleanupConversationsForDeletedStudyCore(
      postFake as never,
      USER,
      ["conv-1"]
    );
    assert.equal(d1, 1);

    // Segunda llamada: conv-1 ya fue eliminada. No debe lanzar error.
    // El estado de la tabla debe permanecer consistente.
    await cleanupConversationsForDeletedStudyCore(
      postFake as never,
      USER,
      ["conv-1"]
    );

    const remaining = postFake.tables.get("chat_conversations") ?? [];
    assert.equal(remaining.length, 0);
  });

  it("findConversationsForStudyCore con estudio sin contextos retorna [] sin error", async () => {
    const fake = createFakeSupabase({
      user: { id: USER },
      tables: {
        chat_conversations: [{ id: "conv-1", user_id: USER }],
        chat_contexts: [],
        chat_messages: [],
      },
    });

    const convIds = await findConversationsForStudyCore(
      fake as never,
      USER,
      "study-nonexistent"
    );
    assert.deepEqual(convIds, []);
  });
});

// ══════════════════════════════════════════════════════════════════
// Caso H: Múltiples contextos, se elimina uno → conversación preservada
// ══════════════════════════════════════════════════════════════════

describe("Caso H — conversación con múltiples contextos, se elimina un estudio", () => {
  it("conversación con 2 contextos, se borra el estudio de uno → queda con 1 → preservada", async () => {
    const preFake = createFakeSupabase({
      user: { id: USER },
      tables: {
        chat_conversations: [{ id: "conv-1", user_id: USER }],
        chat_contexts: [
          { id: "ctx-a", conversation_id: "conv-1", study_id: "study-a", user_id: USER },
          { id: "ctx-del", conversation_id: "conv-1", study_id: DELETED_STUDY, user_id: USER },
        ],
        chat_messages: [
          { id: "msg-1", conversation_id: "conv-1", user_id: USER },
        ],
      },
    });

    const convIds = await findConversationsForStudyCore(
      preFake as never,
      USER,
      DELETED_STUDY
    );
    assert.deepEqual(convIds, ["conv-1"]);

    // Después de CASCADE: ctx-del eliminado, ctx-a persiste
    const postFake = fakeChatDb(
      [{ id: "conv-1", user_id: USER }],
      [{ id: "ctx-a", conversation_id: "conv-1", study_id: "study-a", user_id: USER }],
      [{ id: "msg-1", conversation_id: "conv-1", user_id: USER }]
    );

    const deleted = await cleanupConversationsForDeletedStudyCore(
      postFake as never,
      USER,
      convIds
    );
    assert.equal(deleted, 0); // Conservada

    const remaining = postFake.tables.get("chat_conversations") ?? [];
    assert.equal(remaining.length, 1);

    const remainingCtxs = postFake.tables.get("chat_contexts") ?? [];
    assert.equal(remainingCtxs.length, 1);
    assert.equal(remainingCtxs[0].id, "ctx-a");
  });

  it("conversación con 3 contextos, se borra 2 estudios → queda con 1 → preservada", async () => {
    const preFake = createFakeSupabase({
      user: { id: USER },
      tables: {
        chat_conversations: [{ id: "conv-1", user_id: USER }],
        chat_contexts: [
          { id: "ctx-ok", conversation_id: "conv-1", study_id: "study-ok", user_id: USER },
          { id: "ctx-del1", conversation_id: "conv-1", study_id: "study-del-1", user_id: USER },
          { id: "ctx-del2", conversation_id: "conv-1", study_id: "study-del-2", user_id: USER },
        ],
        chat_messages: [],
      },
    });

    // Simular borrado de study-del-1
    const convIds1 = await findConversationsForStudyCore(
      preFake as never,
      USER,
      "study-del-1"
    );
    assert.deepEqual(convIds1, ["conv-1"]);

    // Después de CASCADE para study-del-1: ctx-del1 eliminado
    const postFake1 = fakeChatDb(
      [{ id: "conv-1", user_id: USER }],
      [
        { id: "ctx-ok", conversation_id: "conv-1", study_id: "study-ok", user_id: USER },
        { id: "ctx-del2", conversation_id: "conv-1", study_id: "study-del-2", user_id: USER },
      ],
      []
    );

    const deleted1 = await cleanupConversationsForDeletedStudyCore(
      postFake1 as never,
      USER,
      convIds1
    );
    assert.equal(deleted1, 0); // Conservada

    // Ahora simular borrado de study-del-2
    const convIds2 = await findConversationsForStudyCore(
      preFake as never,
      USER,
      "study-del-2"
    );
    assert.deepEqual(convIds2, ["conv-1"]);

    // Después de CASCADE para study-del-2: ctx-del2 también eliminado
    const postFake2 = fakeChatDb(
      [{ id: "conv-1", user_id: USER }],
      [
        { id: "ctx-ok", conversation_id: "conv-1", study_id: "study-ok", user_id: USER },
      ],
      []
    );

    const deleted2 = await cleanupConversationsForDeletedStudyCore(
      postFake2 as never,
      USER,
      convIds2
    );
    assert.equal(deleted2, 0); // Aún conserva study-ok

    const remaining = postFake2.tables.get("chat_conversations") ?? [];
    assert.equal(remaining.length, 1);
  });
});
