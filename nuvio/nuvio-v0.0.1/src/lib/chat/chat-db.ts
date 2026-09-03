import type { createClient } from "@/lib/supabase/server";
import type {
  ChatConversation,
  ChatMessage,
  ChatContext,
  ChatRole,
} from "./schema";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Fase 7.3 — Acceso a datos del Chat IA.
 *
 * Núcleo testable con dependencias inyectadas. Todas las funciones reciben
 * el cliente Supabase (o un doble de prueba) y el ID del usuario autenticado.
 *
 * Reglas de seguridad:
 * - NUNCA se confía en el cliente para autorización: cada query filtra por
 *   `user_id` del usuario autenticado.
 * - Los IDs de estudio/conversación recibidos se usan solo como filtro, nunca
 *   como prueba de pertenencia.
 */

// ── Errores tipados ───────────────────────────────────────────

export class ChatError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ChatError";
    this.code = code;
  }
}

// ── Conversaciones ────────────────────────────────────────────

export async function listConversationsCore(
  supabase: Supabase,
  userId: string
): Promise<ChatConversation[]> {
  const { data, error } = await supabase
    .from("chat_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new ChatError("db_error", "Error al cargar las conversaciones.");
  }

  return (data ?? []) as ChatConversation[];
}

export async function getConversationCore(
  supabase: Supabase,
  userId: string,
  conversationId: string
): Promise<ChatConversation> {
  const { data, error } = await supabase
    .from("chat_conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new ChatError("db_error", "Error al cargar la conversación.");
  }

  if (!data) {
    throw new ChatError(
      "not_found",
      "Conversación no encontrada o sin acceso."
    );
  }

  return data as ChatConversation;
}

export async function createConversationCore(
  supabase: Supabase,
  userId: string,
  title: string
): Promise<ChatConversation> {
  const { data, error } = await supabase
    .from("chat_conversations")
    .insert({ user_id: userId, title })
    .select("*")
    .single();

  if (error) {
    throw new ChatError("db_error", "No pudimos crear la conversación.");
  }

  return data as ChatConversation;
}

export async function renameConversationCore(
  supabase: Supabase,
  userId: string,
  conversationId: string,
  title: string
): Promise<ChatConversation> {
  const { data, error } = await supabase
    .from("chat_conversations")
    .update({ title })
    .eq("id", conversationId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new ChatError("db_error", "No pudimos renombrar la conversación.");
  }

  if (!data) {
    throw new ChatError(
      "not_found",
      "Conversación no encontrada o sin acceso."
    );
  }

  return data as ChatConversation;
}

/**
 * Actualiza `updated_at` de una conversación (para que suba en la lista
 * tras actividad). El trigger `update_updated_at_column()` la sobrescribe.
 */
export async function touchConversationCore(
  supabase: Supabase,
  userId: string,
  conversationId: string
): Promise<void> {
  const { error } = await supabase
    .from("chat_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId)
    .eq("user_id", userId);

  if (error) {
    throw new ChatError("db_error", "No pudimos actualizar la conversación.");
  }
}

export async function deleteConversationCore(
  supabase: Supabase,
  userId: string,
  conversationId: string
): Promise<void> {
  // ON DELETE CASCADE limpia messages y contexts.
  const { error } = await supabase
    .from("chat_conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", userId);

  if (error) {
    throw new ChatError("db_error", "No pudimos eliminar la conversación.");
  }
}

// ── Mensajes ──────────────────────────────────────────────────

export async function listMessagesCore(
  supabase: Supabase,
  userId: string,
  conversationId: string
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new ChatError("db_error", "Error al cargar los mensajes.");
  }

  return (data ?? []) as ChatMessage[];
}

export async function addMessageCore(
  supabase: Supabase,
  userId: string,
  conversationId: string,
  role: ChatRole,
  content: string
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ conversation_id: conversationId, user_id: userId, role, content })
    .select("*")
    .single();

  if (error) {
    throw new ChatError("db_error", "No pudimos guardar el mensaje.");
  }

  return data as ChatMessage;
}

// ── Contexto de estudios ──────────────────────────────────────

export async function getContextCore(
  supabase: Supabase,
  userId: string,
  conversationId: string
): Promise<ChatContext[]> {
  const { data, error } = await supabase
    .from("chat_contexts")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new ChatError("db_error", "Error al cargar el contexto.");
  }

  return (data ?? []) as ChatContext[];
}

/**
 * Reemplaza el conjunto de estudios de contexto de una conversación.
 * Elimina los vínculos existentes e inserta los nuevos (idempotente).
 *
 * @param studyIds IDs de estudio ya verificados como propiedad del usuario.
 */
export async function setContextCore(
  supabase: Supabase,
  userId: string,
  conversationId: string,
  studyIds: string[]
): Promise<void> {
  const { error: delError } = await supabase
    .from("chat_contexts")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (delError) {
    throw new ChatError("db_error", "No pudimos actualizar el contexto.");
  }

  if (studyIds.length === 0) return;

  const { error: insError } = await supabase.from("chat_contexts").insert(
    studyIds.map((studyId) => ({
      conversation_id: conversationId,
      study_id: studyId,
      user_id: userId,
    }))
  );

  if (insError) {
    throw new ChatError("db_error", "No pudimos guardar el contexto.");
  }
}

// ── Limpieza post-borrado de estudio ──────────────────────────

/**
 * Identifica conversaciones del usuario que tienen un chat_context
 * apuntando al estudio indicado. Llamar ANTES de `deleteStudyCore`
 * (el CASCADE eliminará estos contextos).
 */
export async function findConversationsForStudyCore(
  supabase: Supabase,
  userId: string,
  studyId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("chat_contexts")
    .select("conversation_id")
    .eq("study_id", studyId)
    .eq("user_id", userId);

  if (error) {
    throw new ChatError("db_error", "Error al buscar conversaciones afectadas.");
  }

  if (!data?.length) return [];

  // Deduplicar (constraints únicas, pero defensivo).
  return [...new Set(data.map((c) => c.conversation_id as string))];
}

/**
 * Elimina conversaciones del usuario que ya no tienen ningún estudio
 * válido asociado (0 contextos tras el CASCADE).
 *
 * - Si la conversación tiene AL menos un contexto → preservar.
 * - Si tiene 0 contextos → eliminar (messages se borran por CASCADE).
 *
 * Llamar DESPUÉS de `deleteStudyCore`.
 *
 * @param conversationIds IDs de conversaciones que estaban asociadas al
 *   estudio eliminado (obtenidos con `findConversationsForStudyCore`).
 */
export async function cleanupConversationsForDeletedStudyCore(
  supabase: Supabase,
  userId: string,
  conversationIds: string[]
): Promise<number> {
  if (conversationIds.length === 0) return 0;

  const toDelete: string[] = [];

  for (const convId of conversationIds) {
    // Verificar si quedan OTROS contextos válidos en esta conversación.
    const { data: remainingContexts } = await supabase
      .from("chat_contexts")
      .select("id")
      .eq("conversation_id", convId)
      .eq("user_id", userId);

    // Si NO quedan contextos → la conversación ya no tiene estudios asociados.
    // Debe eliminarse (messages se borran por CASCADE).
    if (!remainingContexts?.length) {
      toDelete.push(convId);
    }
    // Si quedan contextos → la conversación sigue teniendo estudios, se preserva.
  }

  if (toDelete.length === 0) return 0;

  // Eliminar conversaciones que quedaron sin ningún contexto.
  // ON DELETE CASCADE en chat_messages y chat_contexts limpia todo.
  for (const convId of toDelete) {
    const { error } = await supabase
      .from("chat_conversations")
      .delete()
      .eq("id", convId)
      .eq("user_id", userId);

    if (error) {
      throw new ChatError(
        "db_error",
        "No pudimos limpiar conversaciones asociadas al estudio eliminado."
      );
    }
  }

  return toDelete.length;
}
