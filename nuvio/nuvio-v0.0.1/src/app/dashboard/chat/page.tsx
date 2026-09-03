import { redirect } from "next/navigation";
import { getChatData } from "@/lib/actions/chat";
import { ChatPageLayout } from "@/components/chat/ChatPageLayout";
import { ChatWelcome } from "@/components/chat/ChatWelcome";
import { pickActiveConversationId } from "@/lib/chat/active-conversation";

export const dynamic = "force-dynamic";

/**
 * Vista raíz del Chat IA (`/dashboard/chat`).
 *
 * La fuente de verdad son las conversaciones persistidas del usuario:
 * - 0 conversaciones → pantalla inicial (Welcome), sin historial.
 * - ≥1 conversación → abre la más reciente viajando a `/dashboard/chat/[id]`
 *   (la URL queda como fuente de verdad; al refrescar sigue abierta).
 *
 * El estado se deriva de los datos, no de un booleano local.
 */
export default async function ChatPage() {
  const { conversations } = await getChatData();

  const activeId = pickActiveConversationId(conversations);
  if (activeId) {
    redirect(`/dashboard/chat/${activeId}`);
  }

  return (
    <ChatPageLayout conversations={conversations} hasActiveConversation={false}>
      <ChatWelcome />
    </ChatPageLayout>
  );
}
