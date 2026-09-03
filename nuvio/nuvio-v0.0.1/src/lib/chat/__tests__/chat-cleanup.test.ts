import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { cleanupEmptyConversationsCore } from "../chat-db.ts";
import { createFakeSupabase, type FakeSupabase } from "./fake-supabase.ts";

const USER = "user-1";
const OTHER = "user-2";

/**
 * Helper: crea un fake Supabase con el esquema completo de chat.
 *
 * Tablas relevantes:
 * - chat_conversations: id, user_id
 * - chat_contexts: conversation_id, study_id, user_id
 * - chat_messages: conversation_id, user_id
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
// Caso A: Conversación con un solo estudio → se elimina
// ══════════════════════════════════════════════════════════════════

describe("Caso A — conversación con un solo estudio (0 contextos tras borrado)", () => {
  it("conversación con 0 contextos y 0 mensajes → eliminada", async () => {
    const fake = fakeChatDb(
      [{ id: "conv-1", user_id: USER }],
      [], // 0 contextos (el estudio fue borrado → CASCADE limpió)
      []  // 0 mensajes
    );

    const deleted = await cleanupEmptyConversationsCore(fake as never, USER);
    assert.equal(deleted, 1);

    const remaining = fake.tables.get("chat_conversations") ?? [];
    assert.equal(remaining.length, 0);
  });

  it("conversación con 0 contextos pero 1+ mensajes → preservada", async () => {
    const fake = fakeChatDb(
      [{ id: "conv-1", user_id: USER }],
      [],
      [{ id: "msg-1", conversation_id: "conv-1", user_id: USER }]
    );

    const deleted = await cleanupEmptyConversationsCore(fake as never, USER);
    assert.equal(deleted, 0);

    const remaining = fake.tables.get("chat_conversations") ?? [];
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].id, "conv-1");
  });
});

// ══════════════════════════════════════════════════════════════════
// Caso B: Conversación con múltiples estudios → se conserva
// ══════════════════════════════════════════════════════════════════

describe("Caso B — conversación con múltiples estudios (queda 1 tras borrado)", () => {
  it("conversación con 1 contexto restante → preservada", async () => {
    const fake = fakeChatDb(
      [{ id: "conv-1", user_id: USER }],
      [{ id: "ctx-1", conversation_id: "conv-1", study_id: "study-remaining", user_id: USER }],
      []
    );

    const deleted = await cleanupEmptyConversationsCore(fake as never, USER);
    assert.equal(deleted, 0);

    const remaining = fake.tables.get("chat_conversations") ?? [];
    assert.equal(remaining.length, 1);
  });
});

// ══════════════════════════════════════════════════════════════════
// Caso C: Estudio sin conversaciones asociadas
// ══════════════════════════════════════════════════════════════════

describe("Caso C — estudio sin conversaciones (no hay nada que limpiar)", () => {
  it("sin conversaciones → retorna 0", async () => {
    const fake = fakeChatDb([], [], []);

    const deleted = await cleanupEmptyConversationsCore(fake as never, USER);
    assert.equal(deleted, 0);
  });
});

// ══════════════════════════════════════════════════════════════════
// Caso D: Aislamiento por usuario
// ══════════════════════════════════════════════════════════════════

describe("Caso D — aislamiento cross-user", () => {
  it("conversaciones de otro usuario NO se eliminan", async () => {
    const fake = fakeChatDb(
      [
        { id: "conv-mine-empty", user_id: USER },
        { id: "conv-other-empty", user_id: OTHER },
      ],
      [],
      []
    );

    const deleted = await cleanupEmptyConversationsCore(fake as never, USER);
    assert.equal(deleted, 1); // Solo la mía

    const remaining = fake.tables.get("chat_conversations") ?? [];
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].id, "conv-other-empty"); // La del otro usuario sigue
  });
});

// ══════════════════════════════════════════════════════════════════
// Caso E: Idempotencia
// ══════════════════════════════════════════════════════════════════

describe("Caso E — idempotencia", () => {
  it("llamar dos veces no causa error ni elimina de más", async () => {
    const fake = fakeChatDb(
      [{ id: "conv-empty", user_id: USER }],
      [],
      []
    );

    const d1 = await cleanupEmptyConversationsCore(fake as never, USER);
    assert.equal(d1, 1);

    const d2 = await cleanupEmptyConversationsCore(fake as never, USER);
    assert.equal(d2, 0); // Ya no hay nada que limpiar

    const remaining = fake.tables.get("chat_conversations") ?? [];
    assert.equal(remaining.length, 0);
  });

  it("segunda llamada no elimina conversaciones con mensajes", async () => {
    const fake = fakeChatDb(
      [
        { id: "conv-empty", user_id: USER },
        { id: "conv-with-msgs", user_id: USER },
      ],
      [],
      [{ id: "msg-1", conversation_id: "conv-with-msgs", user_id: USER }]
    );

    const d1 = await cleanupEmptyConversationsCore(fake as never, USER);
    assert.equal(d1, 1); // conv-empty eliminada

    const d2 = await cleanupEmptyConversationsCore(fake as never, USER);
    assert.equal(d2, 0);

    const remaining = fake.tables.get("chat_conversations") ?? [];
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].id, "conv-with-msgs");
  });
});
