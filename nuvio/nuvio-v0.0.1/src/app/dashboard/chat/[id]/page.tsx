import { redirect } from "next/navigation";
import { getChatData } from "@/lib/actions/chat";
import { ChatPageLayout } from "@/components/chat/ChatPageLayout";
import { ChatView } from "@/components/chat/ChatView";

export const dynamic = "force-dynamic";

interface ChatConversationPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ prompt?: string }>;
}

/**
 * Vista de una conversación del Chat IA.
 * Carga conversaciones, mensajes, estudios seleccionables y contexto actual,
 * y los entrega al componente cliente ChatView.
 *
 * `?prompt=` (Fase 8.4): sugerencia/mensaje inicial contextual, propagado desde
 * un CTA de la pantalla de resultados. Es solo UX/contexto, no autorización.
 */
export default async function ChatConversationPage({
  params,
  searchParams,
}: ChatConversationPageProps) {
  const { id } = await params;
  const { prompt } = await searchParams;

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
        initialPrompt={prompt?.trim() || undefined}
      />
    </ChatPageLayout>
  );
}
