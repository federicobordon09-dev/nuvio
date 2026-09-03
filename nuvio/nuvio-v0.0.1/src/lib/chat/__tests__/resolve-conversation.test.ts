import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  ChatError,
  resolveConversationCore,
} from "../chat-db.ts";
import { createFakeSupabase } from "./fake-supabase.ts";

const USER = "user-1";
const OTHER = "user-2";
const CONV = "conv-1";

/**
 * Tests de resolveConversationCore, usado por getChatData para que
 * /dashboard/chat/[id] redirija a /dashboard/chat en vez de devolver 500
 * cuando la conversación no existe o no pertenece al usuario.
 */
describe("resolveConversationCore — F3", () => {
  it("A. conversación inexistente → null (la página redirige a /dashboard/chat)", async () => {
    const fake = createFakeSupabase({
      user: { id: USER },
      tables: { chat_conversations: [] },
    });
    const result = await resolveConversationCore(fake as never, USER, CONV);
    assert.equal(result, null);
  });

  it("B. conversación de otro usuario → null, igual que inexistente (sin existence oracle)", async () => {
    const fake = createFakeSupabase({
      user: { id: USER },
      tables: {
        chat_conversations: [{ id: CONV, user_id: OTHER, title: "de otro" }],
      },
    });
    const result = await resolveConversationCore(fake as never, USER, CONV);
    // Debe comportarse idéntico al caso A: no se distingue una conversación
    // ajena de una inexistente.
    assert.equal(result, null);
  });

  it("C. conversación propia existente → se devuelve sin cambios", async () => {
    const fake = createFakeSupabase({
      user: { id: USER },
      tables: {
        chat_conversations: [{ id: CONV, user_id: USER, title: "mía" }],
      },
    });
    const result = await resolveConversationCore(fake as never, USER, CONV);
    assert.notEqual(result, null);
    assert.equal(result?.id, CONV);
    assert.equal(result?.title, "mía");
  });

  it("D. errores no relacionados con not_found → se propagan, no se ocultan", async () => {
    // Cliente que devuelve un error de BD (db_error) en vez de fila vacía.
    const errFake = {
      from: (table: string) => {
        if (table !== "chat_conversations") {
          throw new Error(`tabla inesperada: ${table}`);
        }
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: null,
                  error: { message: "connection reset" },
                }),
              }),
            }),
          }),
        };
      },
    };

    await assert.rejects(
      () => resolveConversationCore(errFake as never, USER, CONV),
      (err: unknown) =>
        err instanceof ChatError && err.code === "db_error"
    );
  });
});
