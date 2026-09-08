"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sendMessageAction, setContextAction } from "@/lib/actions/chat";
import type { ChatMessage, SelectableStudy } from "@/lib/chat/schema";
import { useSuggestedQuestions } from "@/lib/chat/use-suggested-questions";
import { ContextPicker } from "./ContextPicker";
import { NewConversationStudyPicker } from "./NewConversationStudyPicker";
import { SelectedStudyBanner } from "./SelectedStudyBanner";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { Spinner } from "@/components/ui/Spinner";

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

  const hasMessages = messages.length > 0;
  const hasContext = selectedStudyIds.length > 0;
  const phase: "pick-study" | "suggest" | "chat" = hasMessages
    ? "chat"
    : pickingStudy || !hasContext
      ? "pick-study"
      : "suggest";

  const primaryStudyType = useMemo(() => {
    if (selectedStudyIds.length === 0) return undefined;
    return selectableStudies.find((s) => s.id === selectedStudyIds[0])
      ?.study_type;
  }, [selectedStudyIds, selectableStudies]);

  const { visible: visibleQuestions, markUsed } = useSuggestedQuestions(
    primaryStudyType,
    messages
  );

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
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border px-4 py-3">
        <h1 className="truncate text-[16px] font-medium text-foreground">
          {conversationTitle}
        </h1>
      </div>

      {phase === "chat" && (
        <div className="border-b border-border px-4 py-3">
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
          <div className="space-y-4 px-4 py-4">
            {messages.map((m) => (
              <MessageBubbleInline key={m.id} message={m} />
            ))}
          </div>
        )}

        {sending && (
          <div className="border-t border-border bg-muted/30 px-4 py-2.5">
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Spinner className="h-3.5 w-3.5 text-primary" />
              Nuvio está escribiendo…
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between gap-3 border-t border-border bg-danger-tint/50 px-4 py-2 text-[13px] text-danger">
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

      {phase === "chat" && (
        <SuggestedQuestions
          studyType={primaryStudyType}
          questions={visibleQuestions}
          onSelect={handleSend}
          compact
        />
      )}

      {phase !== "pick-study" && (
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
              placeholder={
                phase === "suggest"
                  ? "Escribí tu pregunta sobre este estudio…"
                  : "Escribí tu pregunta sobre tus estudios…"
              }
              className="max-h-40 min-h-[44px] flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              aria-label="Mensaje"
            />
            <button
              onClick={() => handleSend()}
              disabled={sending || !input.trim()}
              className="inline-flex h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-[14px] font-medium text-primary-foreground transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {sending ? "Enviando…" : "Enviar"}
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Enter para enviar · Shift+Enter para un salto de línea.
          </p>
        </div>
      )}
    </div>
  );
}

function MessageBubbleInline({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-line rounded-xl px-4 py-2.5 text-[14px] leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-surface text-foreground"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}