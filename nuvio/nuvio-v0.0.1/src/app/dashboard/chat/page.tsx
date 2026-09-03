import { getChatData, createConversationAction } from "@/lib/actions/chat";
import { ChatPageLayout } from "@/components/chat/ChatPageLayout";

export const dynamic = "force-dynamic";

/**
 * Vista raíz del Chat IA: sin conversación seleccionada.
 * Muestra la lista de conversaciones y un CTA para crear una nueva.
 */
export default async function ChatPage() {
  const { conversations } = await getChatData();

  return (
    <ChatPageLayout conversations={conversations}>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ocean-tint text-ocean">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
        </div>
        <h1 className="mt-4 text-[18px] font-medium text-foreground">
          Chat IA sobre tus estudios
        </h1>
        <p className="mt-2 max-w-sm text-[14px] text-muted-foreground">
          Creá una conversación, seleccioná tus estudios como contexto y hacé
          preguntas sobre tus resultados.
        </p>
        <form action={createConversationAction} className="mt-6">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primary-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nueva conversación
          </button>
        </form>
      </div>
    </ChatPageLayout>
  );
}
