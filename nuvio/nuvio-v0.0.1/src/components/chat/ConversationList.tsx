"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { deleteConversationAction } from "@/lib/actions/chat";
import type { ChatConversation } from "@/lib/chat/schema";
import { Plus, Trash } from "@/components/ui/icons";

interface ConversationListProps {
  conversations: ChatConversation[];
}

export function ConversationList({ conversations }: ConversationListProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-3 py-3">
        <Link
          href="/dashboard/chat?new=1"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
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
                        ? "bg-primary-muted text-primary"
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
                      <Trash className="h-4 w-4" />
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
