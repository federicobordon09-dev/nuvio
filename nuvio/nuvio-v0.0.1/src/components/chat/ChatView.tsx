"use client";

import { useEffect, useRef, useState } from "react";
import { sendMessageAction } from "@/lib/actions/chat";
import type { ChatMessage, SelectableStudy } from "@/lib/chat/schema";
import { MessageBubble } from "./MessageBubble";
import { ContextPicker } from "./ContextPicker";

interface ChatViewProps {
  conversationId: string;
  conversationTitle: string;
  initialMessages: ChatMessage[];
  selectableStudies: SelectableStudy[];
  contextStudyIds: string[];
}

/**
 * Vista principal del chat: mensajes, selector de contexto e input.
 * El envío es no-streaming (robustez primero): persiste el mensaje del
 * usuario, llama a Gemini y muestra la respuesta, u ofrece reintentar.
 */
export function ChatView({
  conversationId,
  conversationTitle,
  initialMessages,
  selectableStudies,
  contextStudyIds,
}: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;

    setError(null);
    const tempId = `temp-${Date.now()}`;
    const tempUserMessage: ChatMessage = {
      id: tempId,
      conversation_id: conversationId,
      user_id: "",
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);
    setInput("");
    setSending(true);

    const formData = new FormData();
    formData.set("conversationId", conversationId);
    formData.set("content", content);

    try {
      const result = await sendMessageAction(formData);
      setMessages((prev) => {
        // Reemplaza el mensaje optimista por el persistido + agrega la respuesta.
        const withoutTemp = prev.filter((m) => m.id !== tempId);
        if (!result.success) {
          if (result.userMessage) withoutTemp.push(result.userMessage);
          return withoutTemp;
        }
        return [...withoutTemp, result.userMessage, result.assistantMessage];
      });
      if (!result.success) {
        setError(result.error || "No pudimos enviar el mensaje.");
      }
    } catch {
      // En caso de error de red imprevisto, se mantiene el mensaje optimista.
      setError("Ocurrió un error inesperado. Intentá de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Encabezado */}
      <div className="border-b border-border px-4 py-3">
        <h1 className="truncate text-[16px] font-medium text-foreground">
          {conversationTitle}
        </h1>
      </div>

      {/* Contexto */}
      <div className="border-b border-border px-4 py-3">
        <ContextPicker
          conversationId={conversationId}
          selectableStudies={selectableStudies}
          initialContextStudyIds={contextStudyIds}
        />
      </div>

      {/* Mensajes */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-[15px] font-medium text-foreground">
              Empezá la conversación
            </p>
            <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">
              Seleccioná uno o más estudios de contexto y hacé preguntas sobre
              tus resultados.
            </p>
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}

        {sending && (
          <div className="flex justify-start">
            <div className="rounded-xl border border-border bg-surface px-4 py-2.5 text-[13px] text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ocean" />
                Nuvio está escribiendo…
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-danger/30 bg-danger-tint px-3 py-2 text-[13px] text-danger">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="shrink-0 font-medium hover:underline"
              aria-label="Descartar error"
            >
              Descartar
            </button>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder="Escribí tu pregunta sobre tus estudios…"
            className="max-h-40 min-h-[44px] flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-ocean focus:outline-none"
            aria-label="Mensaje"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="inline-flex h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 text-[14px] font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {sending ? "Enviando…" : "Enviar"}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Enter para enviar · Shift+Enter para un salto de línea.
        </p>
      </div>
    </div>
  );
}
