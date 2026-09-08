"use client";

import { useState } from "react";
import { createConversationWithContextAction } from "@/lib/actions/chat";
import { QuestionCircle } from "@/components/ui/icons";

interface StudyChatCtaProps {
  studyId: string;
  label: string;
  prompt?: string | null;
  compact?: boolean;
  primary?: boolean;
}

export function StudyChatCta({
  studyId,
  label,
  prompt,
  compact = false,
  primary = false,
}: StudyChatCtaProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("studyId", studyId);
      if (prompt) formData.set("prompt", prompt);
      await createConversationWithContextAction(formData);
    } catch (err) {
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
        return;
      }
      setError("No pudimos abrir el chat con este estudio. Intentá de nuevo.");
      setBusy(false);
    }
  }

  if (compact) {
    return (
      <div className="mt-2">
        <button
          type="button"
          onClick={handleClick}
          disabled={busy}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
        >
          <QuestionCircle className="h-3.5 w-3.5 shrink-0 text-primary" />
          {busy ? "Abriendo…" : label}
        </button>
        {error && (
          <p className="mt-1 text-[12px] text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 ${
          primary
            ? "bg-primary text-primary-foreground hover:bg-primary-700"
            : "border border-border bg-surface text-foreground hover:border-primary/40 hover:bg-primary-muted"
        }`}
      >
        <QuestionCircle className="h-4 w-4 shrink-0" />
        {busy ? "Abriendo…" : label}
      </button>
      {error && (
        <p className="mt-2 text-[13px] text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
