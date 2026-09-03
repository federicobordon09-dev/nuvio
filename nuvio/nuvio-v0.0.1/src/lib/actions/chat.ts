"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ChatConversation, ChatMessage } from "@/lib/chat/schema";
import {
  ChatError,
  addMessageCore,
  createConversationCore,
  deleteConversationCore,
  getConversationCore,
  listConversationsCore,
  listMessagesCore,
  renameConversationCore,
  setContextCore,
  getContextCore,
  touchConversationCore,
} from "@/lib/chat/chat-db";
import {
  listSelectableStudiesCore,
  assertStudyReadyCore,
  getConversationTitleFromStudyCore,
  loadContextForPromptCore,
} from "@/lib/chat/study-context";
import { generateChatReply } from "@/lib/chat/chat-service";
import { userMessageInputSchema, MAX_CONTEXT_STUDIES } from "@/lib/chat/schema";
import { getChatErrorMessage } from "@/lib/chat/errors";
import { GeminiError } from "@/lib/analysis/gemini";

/** Cantidad máxima de mensajes de historial enviados a Gemini por turno. */
const HISTORY_WINDOW = 20;

async function assertAuthenticated(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}

function errorCodeOf(err: unknown): string {
  if (err instanceof ChatError) return err.code;
  if (err instanceof GeminiError) return err.type;
  return "generic";
}

// ── Lectura ────────────────────────────────────────────────────

export async function listConversations(): Promise<ChatConversation[]> {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);
  return listConversationsCore(supabase, user.id);
}

/**
 * Datos iniciales de la página de chat: conversaciones, mensajes de la
 * conversación seleccionada (si existe), estudios seleccionables y contexto.
 */
export async function getChatData(conversationId?: string) {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);

  const [conversations, selectableStudies] = await Promise.all([
    listConversationsCore(supabase, user.id),
    listSelectableStudiesCore(supabase, user.id),
  ]);

  if (!conversationId) {
    return { conversation: null, messages: [], conversations, selectableStudies, contextStudyIds: [] };
  }

  const conversation = await getConversationCore(supabase, user.id, conversationId);
  const [messages, contextLinks] = await Promise.all([
    listMessagesCore(supabase, user.id, conversationId),
    getContextCore(supabase, user.id, conversationId),
  ]);

  return {
    conversation,
    messages,
    conversations,
    selectableStudies,
    contextStudyIds: contextLinks.map((c) => c.study_id),
  };
}

// ── Escritura de conversación ──────────────────────────────────

export async function createConversationAction(formData: FormData) {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);

  // Título de la conversación. Si el cliente envía un `studyId`, el título se
  // resuelve server-side desde `studies.study_type` (authoritativo) y se
  // convierte con getStudyTypeLabel(). Si no hay estudio, se usa el fallback.
  const studyId = formData.get("studyId");
  let title = "Nueva conversación";
  if (typeof studyId === "string" && studyId) {
    title =
      (await getConversationTitleFromStudyCore(supabase, user.id, studyId)) ??
      title;
  } else {
    const rawTitle = formData.get("title");
    title =
      typeof rawTitle === "string" && rawTitle.trim()
        ? rawTitle.trim().slice(0, 120)
        : title;
  }

  const conversation = await createConversationCore(supabase, user.id, title);
  revalidatePath("/dashboard/chat");
  redirect(`/dashboard/chat/${conversation.id}`);
}

/**
 * Crea una conversación a partir de la selección de estudios del usuario
 * (flujo guiado del Chat IA), usando el tipo del estudio principal como título.
 *
 * El cliente NO provee un título: el servidor resuelve `study_type` de cada
 * estudio autorizado y lo convierte con `getStudyTypeLabel()`. Además vincula
 * el contexto en la misma operación (sin una segunda capa de persistencia).
 */
export async function createConversationWithContextAction(formData: FormData) {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);

  const rawStudyIds = formData.getAll("studyId");
  const studyIds = rawStudyIds
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .slice(0, MAX_CONTEXT_STUDIES);

  // Verifica ownership + disponibilidad de cada estudio antes de vincularlo.
  for (const studyId of studyIds) {
    await assertStudyReadyCore(supabase, user.id, studyId);
  }

  // Título: tipo del primer estudio (autoritativo, server-side).
  const primaryTitle =
    studyIds.length > 0
      ? await getConversationTitleFromStudyCore(
          supabase,
          user.id,
          studyIds[0]
        )
      : null;
  const title = primaryTitle ?? "Nueva conversación";

  const conversation = await createConversationCore(supabase, user.id, title);

  // Vincula el contexto en la misma operación.
  if (studyIds.length > 0) {
    await setContextCore(supabase, user.id, conversation.id, studyIds);
  }

  revalidatePath("/dashboard/chat");
  redirect(`/dashboard/chat/${conversation.id}`);
}

export async function deleteConversationAction(formData: FormData) {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);

  const conversationId = formData.get("conversationId");
  if (typeof conversationId !== "string" || !conversationId) {
    throw new ChatError("db_error", "ID de conversación inválido.");
  }

  await deleteConversationCore(supabase, user.id, conversationId);
  revalidatePath("/dashboard/chat");
  redirect("/dashboard/chat");
}

export async function renameConversationAction(formData: FormData) {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);

  const conversationId = formData.get("conversationId");
  const title = formData.get("title");
  if (typeof conversationId !== "string" || !conversationId) {
    throw new ChatError("db_error", "ID de conversación inválido.");
  }
  if (typeof title !== "string" || !title.trim()) {
    throw new ChatError("db_error", "Título inválido.");
  }

  await renameConversationCore(supabase, user.id, conversationId, title.trim());
  revalidatePath("/dashboard/chat");
}

// ── Contexto ───────────────────────────────────────────────────

export async function setContextAction(formData: FormData) {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);

  const conversationId = formData.get("conversationId");
  if (typeof conversationId !== "string" || !conversationId) {
    throw new ChatError("db_error", "ID de conversación inválido.");
  }

  // Verifica ownership de la conversación.
  await getConversationCore(supabase, user.id, conversationId);

  const rawStudyIds = formData.getAll("studyId");
  const studyIds = rawStudyIds
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .slice(0, MAX_CONTEXT_STUDIES);

  // Verifica ownership + disponibilidad de cada estudio antes de vincularlo.
  for (const studyId of studyIds) {
    await assertStudyReadyCore(supabase, user.id, studyId);
  }

  await setContextCore(supabase, user.id, conversationId, studyIds);
  revalidatePath("/dashboard/chat");
}

// ── Envío de mensaje ───────────────────────────────────────────

export type SendMessageResult =
  | {
      success: true;
      userMessage: ChatMessage;
      assistantMessage: ChatMessage;
    }
  | { success: false; userMessage: ChatMessage; error: string };

/**
 * Envía un mensaje del usuario y obtiene la respuesta del asistente.
 *
 * Flujo:
 * 1. Autenticación + ownership de la conversación.
 * 2. Validación del mensaje (Zod, límite de longitud).
 * 3. Carga de historial y contexto de estudios.
 * 4. Persistencia del mensaje del usuario (se guarda aunque falle la IA).
 * 5. Llamada a Gemini y persistencia de la respuesta del asistente.
 */
export async function sendMessageAction(formData: FormData): Promise<SendMessageResult> {
  const supabase = await createClient();
  const user = await assertAuthenticated(supabase);

  const conversationId = formData.get("conversationId");
  if (typeof conversationId !== "string" || !conversationId) {
    return {
      success: false,
      userMessage: undefined as unknown as ChatMessage,
      error: "ID de conversación inválido.",
    };
  }

  const rawContent = formData.get("content");
  const parsed = userMessageInputSchema.safeParse({ content: rawContent });
  if (!parsed.success) {
    return {
      success: false,
      userMessage: undefined as unknown as ChatMessage,
      error: parsed.error.issues[0]?.message ?? "Mensaje inválido.",
    };
  }

  const content = parsed.data.content;

  try {
    // Ownership de la conversación.
    await getConversationCore(supabase, user.id, conversationId);

    // Historial + contexto.
    const [history, contexts] = await Promise.all([
      listMessagesCore(supabase, user.id, conversationId),
      loadContextForPromptCore(supabase, user.id, conversationId),
    ]);

    // Persistir mensaje del usuario.
    const userMessage = await addMessageCore(
      supabase,
      user.id,
      conversationId,
      "user",
      content
    );

    // Ventana de historial acotada.
    const windowedHistory = history.slice(-HISTORY_WINDOW).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const assistantText = await generateChatReply({
        userMessage: content,
        history: windowedHistory,
        contexts,
      });

      const assistantMessage = await addMessageCore(
        supabase,
        user.id,
        conversationId,
        "assistant",
        assistantText
      );

      // Actualiza `updated_at` para que la conversación suba en la lista.
      await touchConversationCore(supabase, user.id, conversationId);

      revalidatePath("/dashboard/chat");
      return { success: true, userMessage, assistantMessage };
    } catch (geminiErr) {
      revalidatePath("/dashboard/chat");
      return {
        success: false,
        userMessage,
        error: getChatErrorMessage(errorCodeOf(geminiErr)),
      };
    }
  } catch (err) {
    return {
      success: false,
      userMessage: undefined as unknown as ChatMessage,
      error: getChatErrorMessage(errorCodeOf(err)),
    };
  }
}
