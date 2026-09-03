"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { deleteConversationAction } from "@/lib/actions/chat";
import type { ChatConversation } from "@/lib/chat/schema";

interface ConversationListProps {
  conversations: ChatConversation[];
}

/**
 * Lista de conversaciones del usuario + acceso a "Nueva conversación".
 * La conversación activa se resalta. Eliminar usa una action con redirect.
 * "Nueva conversación" navega al flujo guiado (selección de estudio), que
 * crea la conversación con el título derivado del tipo de estudio.
 */
export function ConversationList({ conversations }: ConversationListProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-3 py-3">
        <Link
          href="/dashboard/chat?new=1"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-[13px] font-medium text-white transition-colors hover:bg-primary-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva conversación
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-2" aria-label="Conversaciones">
        {conversations.length === 0 ? (
          <p className="px-3 py-4 text-[13px] text-muted-foreground">
            Todavía no tenés conversaciones.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {conversations.map((conv) => {
              const active = pathname === `/dashboard/chat/${conv.id}`;
              return (
                <li key={conv.id} className="group flex items-center gap-1">
                  <Link
                    href={`/dashboard/chat/${conv.id}`}
                    className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                      active
                        ? "bg-ocean-tint text-ocean-dark"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="truncate">{conv.title}</span>
                  </Link>
                  <form action={deleteConversationAction} className="shrink-0">
                    <input type="hidden" name="conversationId" value={conv.id} />
                    <button
                      type="submit"
                      aria-label={`Eliminar conversación ${conv.title}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-opacity hover:bg-danger-tint hover:text-danger focus:opacity-100 group-hover:opacity-100"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </div>
  );
}
