"use client";

import { useState } from "react";
import { ConversationList } from "./ConversationList";
import type { ChatConversation } from "@/lib/chat/schema";
import { Menu } from "@/components/ui/icons";

interface ChatPageLayoutProps {
  conversations: ChatConversation[];
  children: React.ReactNode;
  hasActiveConversation?: boolean;
}

/** Altura total del botón mobile de conversaciones (`h-11`, border-box incluido). */
const MOBILE_TOGGLE_HEIGHT = 44;

export function ChatPageLayout({
  conversations,
  children,
  hasActiveConversation = true,
}: ChatPageLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!hasActiveConversation) {
    return (
      <div className="flex h-[calc(100vh-7rem)] min-h-[480px] overflow-hidden rounded-2xl border border-border bg-surface shadow-md lg:h-[calc(100vh-6rem)]">
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-7rem)] min-h-[480px] gap-4 overflow-hidden lg:h-[calc(100vh-6rem)] lg:grid-cols-[280px_1fr] lg:gap-6">
      <aside className="hidden min-h-0 lg:block">
        <ConversationList conversations={conversations} />
      </aside>

      <div className="relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-md">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-11 w-full shrink-0 items-center gap-2 border-b border-border bg-background px-4 text-caption font-medium text-primary transition-colors duration-150 hover:bg-primary-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lilac-glow lg:hidden"
          aria-expanded={mobileOpen}
        >
          <Menu className="h-4 w-4" />
          {mobileOpen ? "Ocultar conversaciones" : "Conversaciones"}
        </button>

        {mobileOpen && (
          /* Debe arrancar justo debajo del botón: `h-11` (44px, border-box). */
          <div
            className="absolute inset-x-0 z-20 overflow-hidden border-b border-border bg-surface shadow-lg lg:hidden"
            style={{
              top: MOBILE_TOGGLE_HEIGHT,
              height: `calc(100% - ${MOBILE_TOGGLE_HEIGHT}px)`,
            }}
          >
            <ConversationList conversations={conversations} />
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
