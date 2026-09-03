import { redirect } from "next/navigation";
import { getChatData } from "@/lib/actions/chat";
import { ChatPageLayout } from "@/components/chat/ChatPageLayout";
import { ChatView } from "@/components/chat/ChatView";

export const dynamic = "force-dynamic";

interface ChatConversationPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Vista de una conversación del Chat IA.
 * Carga conversaciones, mensajes, estudios seleccionables y contexto actual,
 * y los entrega al componente cliente ChatView.
 */
export default async function ChatConversationPage({
  params,
}: ChatConversationPageProps) {
  const { id } = await params;

  const data = await getChatData(id);
  if (!data.conversation) {
    redirect("/dashboard/chat");
  }

  return (
    <ChatPageLayout conversations={data.conversations}>
      <ChatView
        conversationId={data.conversation.id}
        conversationTitle={data.conversation.title}
        initialMessages={data.messages}
        selectableStudies={data.selectableStudies}
        contextStudyIds={data.contextStudyIds}
      />
    </ChatPageLayout>
  );
}
