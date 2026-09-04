"use client";

import { useState } from "react";
import { createConversationWithContextAction } from "@/lib/actions/chat";

interface StudyChatCtaProps {
  studyId: string;
  /** Texto visible del botón. */
  label: string;
  /** Sugerencia/mensaje inicial contextual (opcional). */
  prompt?: string | null;
  /** Variante compacta para hallazgos/mediciones. */
  compact?: boolean;
  /** Variante primaria (CTA del estudio completo). */
  primary?: boolean;
}

/**
 * Fase 8.4 — CTA contextual hacia el Chat IA.
 *
 * Botón accesible que crea una conversación con el estudio como contexto
 * (reutilizando `createConversationWithContextAction`) y redirige al Chat.
 * Un único punto de entrada para los CTAs de estudio/hallazgo/medición:
 * no se construyen URLs manualmente por todos lados.
 *
 * - `study_id` y la autorización se resuelven server-side (assertStudyReadyCore);
 *   este botón NO confía en IDs del cliente.
 * - El `prompt` es solo una sugerencia inicial de UX, nunca una prueba de acceso.
 */
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
      // La action redirige a /dashboard/chat/[id] al crear la conversación.
      await createConversationWithContextAction(formData);
    } catch {
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
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:border-ocean/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean disabled:opacity-60"
        >
          <svg
            className="h-3.5 w-3.5 shrink-0 text-ocean"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
            />
          </svg>
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
        className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean disabled:opacity-60 ${
          primary
            ? "bg-primary-600 text-white hover:bg-primary-700"
            : "border border-border bg-surface text-foreground hover:border-ocean/40 hover:bg-ocean-tint/40"
        }`}
      >
        <svg
          className="h-4 w-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
          />
        </svg>
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
