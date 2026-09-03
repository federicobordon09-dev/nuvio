import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  ChatError,
  listConversationsCore,
  getConversationCore,
  createConversationCore,
  renameConversationCore,
  deleteConversationCore,
  listMessagesCore,
  addMessageCore,
  getContextCore,
  setContextCore,
} from "../chat-db.ts";
import { createFakeSupabase } from "./fake-supabase.ts";

const USER_ID = "user-1";
const CONV_ID = "conv-1";

function assertChatError(err: unknown, code: string): asserts err is ChatError {
  assert.ok(err instanceof ChatError, `esperaba ChatError, recibí: ${err}`);
  assert.equal(err.code, code);
}

describe("listConversationsCore", () => {
  it("devuelve solo las conversaciones del usuario, ordenadas por updated_at desc", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      tables: {
        chat_conversations: [
          { id: "c1", user_id: USER_ID, title: "A", updated_at: "2026-01-01T00:00:00Z" },
          { id: "c2", user_id: USER_ID, title: "B", updated_at: "2026-01-03T00:00:00Z" },
          { id: "c3", user_id: "user-2", title: "Otro", updated_at: "2026-01-02T00:00:00Z" },
        ],
      },
    });

    const list = await listConversationsCore(fake as never, USER_ID);
    assert.equal(list.length, 2);
    assert.equal(list[0].id, "c2"); // más reciente primero
    assert.equal(list[1].id, "c1");
    assert.ok(fake.calls.includes("from(chat_conversations)"));
  });
});

describe("getConversationCore", () => {
  it("encuentra la conversación propia", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      tables: {
        chat_conversations: [{ id: CONV_ID, user_id: USER_ID, title: "X" }],
      },
    });
    const conv = await getConversationCore(fake as never, USER_ID, CONV_ID);
    assert.equal(conv.id, CONV_ID);
  });

  it("conversación de otro usuario → not_found (ownership)", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      tables: {
        chat_conversations: [{ id: CONV_ID, user_id: "user-2", title: "X" }],
      },
    });
    await assert.rejects(
      () => getConversationCore(fake as never, USER_ID, CONV_ID),
      (err) => {
        assertChatError(err, "not_found");
        return true;
      }
    );
  });

  it("conversación inexistente → not_found", async () => {
    const fake = createFakeSupabase({ user: { id: USER_ID }, tables: {} });
    await assert.rejects(
      () => getConversationCore(fake as never, USER_ID, "missing"),
      (err) => {
        assertChatError(err, "not_found");
        return true;
      }
    );
  });
});

describe("createConversationCore", () => {
  it("inserta con user_id y título, devuelve la fila", async () => {
    const fake = createFakeSupabase({ user: { id: USER_ID }, tables: {} });
    const conv = await createConversationCore(fake as never, USER_ID, "Mi chat");
    assert.equal(conv.user_id, USER_ID);
    assert.equal(conv.title, "Mi chat");
    assert.ok(fake.calls.includes("from(chat_conversations)"));
  });
});

describe("renameConversationCore", () => {
  it("actualiza el título de una conversación propia", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      tables: { chat_conversations: [{ id: CONV_ID, user_id: USER_ID, title: "Antes" }] },
    });
    const conv = await renameConversationCore(fake as never, USER_ID, CONV_ID, "Después");
    assert.equal(conv.title, "Después");
  });

  it("conversación inexistente → not_found", async () => {
    const fake = createFakeSupabase({ user: { id: USER_ID }, tables: {} });
    await assert.rejects(
      () => renameConversationCore(fake as never, USER_ID, "missing", "X"),
      (err) => {
        assertChatError(err, "not_found");
        return true;
      }
    );
  });
});

describe("deleteConversationCore", () => {
  it("elimina la conversación del usuario", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      tables: {
        chat_conversations: [
          { id: CONV_ID, user_id: USER_ID },
          { id: "c2", user_id: "user-2" },
        ],
      },
    });
    await deleteConversationCore(fake as never, USER_ID, CONV_ID);
    const remaining = fake.tables.get("chat_conversations") ?? [];
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].id, "c2");
  });
});

describe("listMessagesCore", () => {
  it("devuelve los mensajes de la conversación en orden ascendente", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      tables: {
        chat_messages: [
          { id: "m1", conversation_id: CONV_ID, user_id: USER_ID, role: "user", created_at: "2026-01-01T00:00:01Z" },
          { id: "m2", conversation_id: CONV_ID, user_id: USER_ID, role: "assistant", created_at: "2026-01-01T00:00:00Z" },
        ],
      },
    });
    const msgs = await listMessagesCore(fake as never, USER_ID, CONV_ID);
    assert.equal(msgs.length, 2);
    assert.equal(msgs[0].id, "m2"); // más antiguo primero
  });
});

describe("addMessageCore", () => {
  it("inserta un mensaje con rol y contenido", async () => {
    const fake = createFakeSupabase({ user: { id: USER_ID }, tables: {} });
    const msg = await addMessageCore(fake as never, USER_ID, CONV_ID, "assistant", "Hola");
    assert.equal(msg.role, "assistant");
    assert.equal(msg.content, "Hola");
    assert.equal(msg.user_id, USER_ID);
    assert.equal(msg.conversation_id, CONV_ID);
  });
});

describe("getContextCore", () => {
  it("devuelve los contextos de la conversación", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      tables: {
        chat_contexts: [
          { id: "x1", conversation_id: CONV_ID, study_id: "s1", user_id: USER_ID },
          { id: "x2", conversation_id: CONV_ID, study_id: "s2", user_id: USER_ID },
        ],
      },
    });
    const ctx = await getContextCore(fake as never, USER_ID, CONV_ID);
    assert.equal(ctx.length, 2);
  });
});

describe("setContextCore", () => {
  it("reemplaza los vínculos de contexto", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      tables: {
        chat_contexts: [{ id: "x1", conversation_id: CONV_ID, study_id: "s1", user_id: USER_ID }],
      },
    });
    await setContextCore(fake as never, USER_ID, CONV_ID, ["s2", "s3"]);
    const remaining = fake.tables.get("chat_contexts") ?? [];
    // Se eliminan los anteriores y se insertan los nuevos.
    assert.equal(remaining.length, 2);
    const studyIds = remaining.map((r) => r.study_id).sort();
    assert.deepEqual(studyIds, ["s2", "s3"]);
  });

  it("lista vacía → solo elimina los existentes", async () => {
    const fake = createFakeSupabase({
      user: { id: USER_ID },
      tables: {
        chat_contexts: [{ id: "x1", conversation_id: CONV_ID, study_id: "s1", user_id: USER_ID }],
      },
    });
    await setContextCore(fake as never, USER_ID, CONV_ID, []);
    const remaining = fake.tables.get("chat_contexts") ?? [];
    assert.equal(remaining.length, 0);
  });
});
