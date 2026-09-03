import { test } from "node:test";
import assert from "node:assert/strict";
import { pickActiveConversationId } from "../active-conversation.ts";
import type { ChatConversation } from "../schema.ts";

function conv(id: string, updatedAt = id): ChatConversation {
  return {
    id,
    user_id: "user-1",
    title: `Conversación ${id}`,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: updatedAt,
  };
}

test("0 conversaciones → null (Welcome)", () => {
  assert.equal(pickActiveConversationId([]), null);
  assert.equal(pickActiveConversationId([], "any-id"), null);
});

test("1 conversación, sin ID → abre esa", () => {
  const conversations = [conv("a")];
  assert.equal(pickActiveConversationId(conversations), "a");
});

test("N conversaciones, sin ID → abre la más reciente (primera de la lista)", () => {
  const conversations = [conv("reciente", "2026-05-01"), conv("vieja", "2026-01-01")];
  assert.equal(pickActiveConversationId(conversations), "reciente");
});

test("conversationId válido → abre esa conversación", () => {
  const conversations = [conv("reciente"), conv("b"), conv("c")];
  assert.equal(pickActiveConversationId(conversations, "b"), "b");
});

test("conversationId inválido/no autorizado → no abre, cae a la más reciente", () => {
  const conversations = [conv("a"), conv("b")];
  // El ID no pertenece al usuario / no existe → se ignora.
  assert.equal(pickActiveConversationId(conversations, "no-pertence"), "a");
});

test("conversationId vacío/undefined → se trata como ausente", () => {
  const conversations = [conv("a")];
  assert.equal(pickActiveConversationId(conversations, ""), "a");
  assert.equal(pickActiveConversationId(conversations, null), "a");
  assert.equal(pickActiveConversationId(conversations, undefined), "a");
});
