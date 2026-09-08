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

export function ChatPageLayout({
  conversations,
  children,
  hasActiveConversation = true,
}: ChatPageLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!hasActiveConversation) {
    return (
      <div className="flex h-[calc(100vh-7rem)] min-h-[480px] overflow-hidden rounded-xl border border-border bg-surface lg:h-[calc(100vh-6rem)]">
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-7rem)] min-h-[480px] overflow-hidden rounded-xl border border-border bg-surface lg:h-[calc(100vh-6rem)] lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r border-border bg-muted/30 lg:block">
        <ConversationList conversations={conversations} />
      </aside>

      <div className="relative flex min-h-0 min-w-0 flex-col">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2.5 text-[13px] font-medium text-primary lg:hidden"
          aria-expanded={mobileOpen}
        >
          <Menu className="h-4 w-4" />
          {mobileOpen ? "Ocultar conversaciones" : "Conversaciones"}
        </button>

        {mobileOpen && (
          <div className="absolute inset-x-0 top-[41px] z-20 h-[calc(100%-41px)] border-b border-border bg-background lg:hidden">
            <ConversationList conversations={conversations} />
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}