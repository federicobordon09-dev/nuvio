"use client";

import { useState } from "react";
import { ConversationList } from "./ConversationList";
import type { ChatConversation } from "@/lib/chat/schema";

interface ChatPageLayoutProps {
  conversations: ChatConversation[];
  children: React.ReactNode;
  /** Si hay una conversación activa. Sin ella se omite el panel de historial. */
  hasActiveConversation?: boolean;
}

/**
 * Marco del chat. Con conversación activa usa dos paneles: lista de
 * conversaciones (sidebar en desktop, drawer en mobile) + panel principal.
 * Sin conversación activa (estado inicial), muestra solo el contenido
 * centrado — la pantalla inicial — sin el panel de historial.
 * El alto se ajusta al viewport.
 */
export function ChatPageLayout({
  conversations,
  children,
  hasActiveConversation = true,
}: ChatPageLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Estado inicial: sin conversación activa → pantalla inicial sin historial.
  if (!hasActiveConversation) {
    return (
      <div className="flex h-[calc(100vh-7rem)] min-h-[480px] overflow-hidden rounded-xl border border-border lg:h-[calc(100vh-6rem)]">
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-7rem)] min-h-[480px] overflow-hidden rounded-xl border border-border lg:h-[calc(100vh-6rem)] lg:grid-cols-[280px_1fr]">
      {/* Sidebar desktop */}
      <aside className="hidden border-r border-border bg-muted/40 lg:block">
        <ConversationList conversations={conversations} />
      </aside>

      {/* Panel principal */}
      <div className="relative flex min-w-0 flex-col">
        {/* Toggle mobile */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2.5 text-[13px] font-medium text-ocean lg:hidden"
          aria-expanded={mobileOpen}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
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
