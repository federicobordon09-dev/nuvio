import { redirect } from "next/navigation";
import { getChatData } from "@/lib/actions/chat";
import { ChatPageLayout } from "@/components/chat/ChatPageLayout";
import { ChatWelcome } from "@/components/chat/ChatWelcome";
import { NewConversationPanel } from "@/components/chat/NewConversationPanel";
import { pickActiveConversationId } from "@/lib/chat/active-conversation";

export const dynamic = "force-dynamic";

/**
 * Vista raíz del Chat IA (`/dashboard/chat`).
 *
 * La fuente de verdad son las conversaciones persistidas del usuario:
 * - ?new=1   → flujo guiado "Nueva conversación": selector de estudio que crea
 *              la conversación con el título del tipo de estudio.
 * - 0 conversaciones → pantalla inicial (Welcome), sin historial.
 * - ≥1 conversación → abre la más reciente viajando a `/dashboard/chat/[id]`
 *   (la URL queda como fuente de verdad; al refrescar sigue abierta).
 *
 * El estado se deriva de los datos, no de un booleano local.
 */
export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { conversations, selectableStudies } = await getChatData();
  const { new: isNew } = await searchParams;

  if (isNew === "1") {
    return (
      <ChatPageLayout conversations={conversations} hasActiveConversation={false}>
        <NewConversationPanel studies={selectableStudies} />
      </ChatPageLayout>
    );
  }

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
