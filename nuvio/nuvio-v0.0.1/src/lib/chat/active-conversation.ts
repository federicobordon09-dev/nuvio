import type { ChatConversation } from "./schema";

/**
 * Determina qué conversación debe abrirse al entrar al Chat IA.
 *
 * La fuente de verdad es la base de datos (lista ya ordenada por
 * `updated_at` desc en `listConversationsCore`).
 *
 * Orden de preferencia:
 * 1. Si se pide un ID (`requestedId`) que existe en las conversaciones del
 *    usuario → ese (ruta `/dashboard/chat/[id]`).
 * 2. Si no → la más reciente (`conversations[0]`).
 * 3. Sin conversaciones (o sin ninguna que coincida con lo pedido) → `null`,
 *    para que el caller decida (Welcome / redirect seguro).
 *
 * Es pura y no confía en IDs del cliente: solo abre un `requestedId` si ese
 * ID ya forma parte de las conversaciones del usuario autenticado.
 */
export function pickActiveConversationId(
  conversations: ChatConversation[],
  requestedId?: string | null
): string | null {
  if (requestedId && conversations.some((c) => c.id === requestedId)) {
    return requestedId;
  }
  return conversations[0]?.id ?? null;
}
