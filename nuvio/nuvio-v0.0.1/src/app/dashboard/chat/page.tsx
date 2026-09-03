import { getChatData } from "@/lib/actions/chat";
import { ChatPageLayout } from "@/components/chat/ChatPageLayout";
import { ChatWelcome } from "@/components/chat/ChatWelcome";

export const dynamic = "force-dynamic";

/**
 * Vista raíz del Chat IA: sin conversación seleccionada.
 * Muestra la lista de conversaciones y la pantalla de bienvenida guiada.
 */
export default async function ChatPage() {
  const { conversations } = await getChatData();

  return (
    <ChatPageLayout conversations={conversations} hasActiveConversation={false}>
      <ChatWelcome />
    </ChatPageLayout>
  );
}
