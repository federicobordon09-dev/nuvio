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
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-caption font-medium text-primary-foreground transition-all duration-150 hover:bg-primary/90 hover:shadow-md active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Nueva conversación
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-2" aria-label="Conversaciones">
        {conversations.length === 0 ? (
          <p className="px-3 py-4 text-caption text-muted-foreground">
            Todavía no tenés conversaciones.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {conversations.map((conv) => {
              const active = pathname === `/dashboard/chat/${conv.id}`;
              return (
                <li key={conv.id} className="group flex items-center gap-1">
                  <Link
                    href={`/dashboard/chat/${conv.id}`}
                    className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-caption font-medium transition-all duration-150 ${
                      active
                        ? "bg-primary-muted text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-primary-muted/40 hover:text-foreground"
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
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all duration-150 hover:bg-danger-tint hover:text-danger focus:opacity-100 group-hover:opacity-100 active:scale-[0.95]"
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
