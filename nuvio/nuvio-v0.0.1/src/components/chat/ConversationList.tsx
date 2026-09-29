"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { deleteConversationAction } from "@/lib/actions/chat";
import type { ChatConversation } from "@/lib/chat/schema";
import { Plus, Trash } from "@/components/ui/icons";

interface ConversationListProps {
  conversations: ChatConversation[];
}

function formatConversationDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

export function ConversationList({ conversations }: ConversationListProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-1">
      <div className="shrink-0 rounded-xl border border-border bg-surface p-3 shadow-sm">
        <Link
          href="/dashboard/chat?new=1"
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-caption font-medium text-primary-foreground shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lilac-glow focus-visible:ring-offset-2 active:translate-y-0"
        >
          <Plus className="h-4 w-4" />
          Nueva conversación
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-xl border border-border bg-surface p-3 shadow-sm">
        <div className="flex items-baseline justify-between gap-2 px-1">
          <p className="data-label">Historial de conversaciones</p>
          <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
            {conversations.length}{" "}
            {conversations.length === 1 ? "sesión" : "sesiones"}
          </span>
        </div>

        <nav
          className="min-h-0 flex-1 overflow-y-auto"
          aria-label="Conversaciones"
        >
          {conversations.length === 0 ? (
            <p className="py-3 text-center text-caption text-muted-foreground">
              Todavía no tenés conversaciones.
            </p>
          ) : (
            <ul className="flex flex-col gap-1" role="list">
              {conversations.map((conv) => {
                const active = pathname === `/dashboard/chat/${conv.id}`;
                return (
                  <li key={conv.id} className="group">
                    <div
                      className={`relative flex items-center gap-1 rounded-xl transition-colors duration-150 ${
                        active ? "bg-primary-muted/60" : "hover:bg-background"
                      }`}
                    >
                      {active && (
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-2 left-0 w-1 rounded-full bg-primary"
                        />
                      )}
                      <Link
                        href={`/dashboard/chat/${conv.id}`}
                        className={`flex min-h-11 min-w-0 flex-1 flex-col gap-0.5 rounded-xl py-2.5 pl-4 pr-2 transition-colors duration-150 ${
                          active
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        aria-current={active ? "page" : undefined}
                      >
                        <span className="flex w-full items-center justify-between gap-2">
                          <span
                            className={`min-w-0 truncate text-caption ${
                              active
                                ? "font-semibold text-primary"
                                : "font-medium text-foreground"
                            }`}
                          >
                            {conv.title}
                          </span>
                          <time
                            dateTime={conv.updated_at}
                            suppressHydrationWarning
                            className="shrink-0 text-[11px] font-medium text-plum-muted"
                          >
                            {formatConversationDate(conv.updated_at)}
                          </time>
                        </span>
                      </Link>
                      <form
                        action={deleteConversationAction}
                        className="shrink-0 pr-1.5"
                      >
                        <input
                          type="hidden"
                          name="conversationId"
                          value={conv.id}
                        />
                        <button
                          type="submit"
                          aria-label={`Eliminar conversación ${conv.title}`}
                          className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all duration-150 hover:bg-danger-tint hover:text-danger focus:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>
      </div>
    </div>
  );
}
