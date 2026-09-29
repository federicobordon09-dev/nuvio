"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { sendMessageAction, setContextAction } from "@/lib/actions/chat";
import type { ChatMessage, SelectableStudy } from "@/lib/chat/schema";
import { useSuggestedQuestions } from "@/lib/chat/use-suggested-questions";
import { ContextPicker } from "./ContextPicker";
import { MessageBubble } from "./MessageBubble";
import { NewConversationStudyPicker } from "./NewConversationStudyPicker";
import { SelectedStudyBanner } from "./SelectedStudyBanner";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { Spinner } from "@/components/ui/Spinner";
import { Chat, Send } from "@/components/ui/icons";

interface ChatViewProps {
  conversationId: string;
  conversationTitle: string;
  initialMessages: ChatMessage[];
  selectableStudies: SelectableStudy[];
  contextStudyIds: string[];
  initialPrompt?: string;
}

export function ChatView({
  conversationId,
  conversationTitle,
  initialMessages,
  selectableStudies,
  contextStudyIds,
  initialPrompt,
}: ChatViewProps) {
  const [selectedStudyIds, setSelectedStudyIds] =
    useState<string[]>(contextStudyIds);
  const [contextError, setContextError] = useState<string | null>(null);
  const [pickingStudy, setPickingStudy] = useState(
    () => contextStudyIds.length === 0
  );

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoSendPromptRef = useRef<string | null>(null);

  const hasMessages = messages.length > 0;
  const hasContext = selectedStudyIds.length > 0;
  const phase: "pick-study" | "suggest" | "chat" = hasMessages
    ? "chat"
    : pickingStudy || !hasContext
      ? "pick-study"
      : "suggest";

  const doSend = useCallback(async (content: string) => {
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
    setSending(true);

    const formData = new FormData();
    formData.set("conversationId", conversationId);
    formData.set("content", content);

    try {
      const result = await sendMessageAction(formData);
      setMessages((prev) => {
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
      setError("Ocurrió un error inesperado. Intentá de nuevo.");
    } finally {
      setSending(false);
    }
  }, [conversationId, sending]);

  const primaryStudyType = useMemo(() => {
    if (selectedStudyIds.length === 0) return undefined;
    return selectableStudies.find((s) => s.id === selectedStudyIds[0])
      ?.study_type;
  }, [selectedStudyIds, selectableStudies]);

  const { visible: visibleQuestions, markUsed } = useSuggestedQuestions(
    primaryStudyType,
    messages
  );

  // Schedule auto-send for initial prompt when arriving from a CTA
  // handleSend is a function declaration (hoisted), safe to omit from deps
  useEffect(() => {
    if (autoSendPromptRef.current !== null) return;
    if (!initialPrompt) return;
    if (hasMessages) return;
    if (!hasContext) return;
    if (sending) return;
    autoSendPromptRef.current = initialPrompt;
    // Defer send to avoid setState-in-effect lint error
    const id = requestAnimationFrame(() => {
      handleSend(initialPrompt);
    });
    return () => cancelAnimationFrame(id);
  }, [initialPrompt, hasMessages, hasContext, sending]);

  const guidedQuestions = useMemo(() => {
    if (!initialPrompt) return visibleQuestions;
    return [
      initialPrompt,
      ...visibleQuestions.filter((q) => q !== initialPrompt),
    ];
  }, [initialPrompt, visibleQuestions]);

  async function persistContext(nextIds: string[]) {
    setContextError(null);
    const formData = new FormData();
    formData.set("conversationId", conversationId);
    for (const id of nextIds) formData.append("studyId", id);
    try {
      await setContextAction(formData);
    } catch {
      return false;
    }
    return true;
  }

  async function toggleStudy(studyId: string, checked: boolean) {
    const next = checked
      ? [...selectedStudyIds, studyId]
      : selectedStudyIds.filter((id) => id !== studyId);
    const prev = selectedStudyIds;
    setSelectedStudyIds(next);
    if (!(await persistContext(next))) {
      setSelectedStudyIds(prev);
      setContextError("No pudimos actualizar el contexto.");
    }
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  async function handleSend(rawContent?: string) {
    const content = (rawContent ?? input).trim();
    if (!content || sending) return;

    if (rawContent !== undefined) markUsed(rawContent);

    if (rawContent === undefined) setInput("");

    await doSend(content);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-start gap-3 border-b border-border px-4 py-4 sm:px-6">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-lilac-glow shadow-sm"
        >
          <Chat className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="data-label">Conversación</p>
          <h1 className="truncate text-heading text-primary">
            {conversationTitle}
          </h1>
        </div>
      </header>

      {phase === "chat" && (
        <div className="shrink-0 border-b border-border bg-background px-4 py-3 sm:px-6">
          <ContextPicker
            studies={selectableStudies}
            selectedIds={selectedStudyIds}
            onToggle={toggleStudy}
            error={contextError}
          />
        </div>
      )}

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto"
        aria-live="polite"
      >
        {phase === "pick-study" && (
          <NewConversationStudyPicker
            studies={selectableStudies}
            selectedIds={selectedStudyIds}
            onToggle={toggleStudy}
            onContinue={() => setPickingStudy(false)}
          />
        )}

        {phase === "suggest" && (
          <>
            <SelectedStudyBanner
              studies={selectableStudies}
              selectedIds={selectedStudyIds}
              onChangeStudy={() => setPickingStudy(true)}
            />
            <SuggestedQuestions
              studyType={primaryStudyType}
              questions={guidedQuestions}
              onSelect={handleSend}
            />
          </>
        )}

        {phase === "chat" && (
          <div className="flex flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>
        )}

        {sending && (
          <div className="border-t border-border bg-background/70 px-4 py-2.5 sm:px-6">
            <div className="flex items-center gap-2 text-caption text-muted-foreground">
              <Spinner className="h-3.5 w-3.5 text-primary" />
              Nuvio está escribiendo…
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between gap-3 border-t border-danger/20 bg-danger-tint px-4 py-2.5 text-caption text-danger sm:px-6">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="shrink-0 rounded-md px-2 py-1 font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
              aria-label="Descartar error"
            >
              Descartar
            </button>
          </div>
        )}
      </div>

      {phase === "chat" && (
        <SuggestedQuestions
          studyType={primaryStudyType}
          questions={visibleQuestions}
          onSelect={handleSend}
          compact
        />
      )}

      {phase !== "pick-study" && (
        <div className="shrink-0 border-t border-border bg-surface px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-end gap-2 rounded-xl border border-border-strong bg-background px-2 py-1.5 transition-shadow duration-150 focus-within:border-lilac-glow focus-within:ring-[3px] focus-within:ring-lilac-glow/20">
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
              placeholder={
                phase === "suggest"
                  ? "Escribí tu pregunta sobre este estudio…"
                  : "Escribí tu pregunta sobre tus estudios…"
              }
              className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2.5 text-body leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
              aria-label="Mensaje"
              aria-describedby="chat-composer-hint"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={sending || !input.trim()}
              aria-label={sending ? "Enviando mensaje" : "Enviar mensaje"}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary-hover hover:shadow-md active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <p className="text-[11px] leading-4 text-muted-foreground">
              Nuvio es una herramienta de explicación y orientación informativa.
              No reemplaza la evaluación de un profesional de la salud.
            </p>
            <p
              id="chat-composer-hint"
              className="shrink-0 text-[11px] leading-4 text-muted-foreground"
            >
              Enter para enviar · Shift+Enter para un salto de línea.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
