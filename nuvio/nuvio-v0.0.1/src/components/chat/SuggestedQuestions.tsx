"use client";

import { getSuggestedQuestions } from "@/lib/chat/suggested-questions";

interface SuggestedQuestionsProps {
  /** Tipo de estudio del contexto principal; define las preguntas. */
  studyType?: string | null;
  /** Se llama con la pregunta elegida; reutiliza el flujo de envío existente. */
  onSelect: (question: string) => void;
  /** Variante compacta (chips) para el chat ya activo. */
  compact?: boolean;
  /** Título de la sección grande (por defecto, el de la experiencia guiada). */
  title?: string;
  /** Subtítulo de la sección grande. */
  subtitle?: string;
}

/**
 * Preguntas sugeridas accionables. Botones reales (accesibles por teclado) que
 * envían la pregunta por el mismo mecanismo del chat (nada de copiar/pegar).
 * Las sugerencias son determinísticas/locales y nunca reemplazan el input.
 */
export function SuggestedQuestions({
  studyType,
  onSelect,
  compact = false,
  title = "¿Qué querés saber sobre este estudio?",
  subtitle = "Podés elegir una pregunta o escribir la tuya.",
}: SuggestedQuestionsProps) {
  const questions = getSuggestedQuestions(studyType);

  if (compact) {
    return (
      <div className="border-t border-border px-4 pb-1 pt-2">
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          También podés preguntar
        </p>
        <div className="flex flex-wrap gap-2">
          {questions.slice(0, 3).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onSelect(q)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-left text-[12px] font-medium text-muted-foreground transition-colors hover:border-ocean/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean"
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
              <span className="max-w-[220px] truncate sm:max-w-none">{q}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-2 pt-4">
      <h2 className="text-[17px] font-medium leading-tight text-foreground">
        {title}
      </h2>
      <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {questions.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onSelect(q)}
            className="flex items-start gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-left transition-colors hover:border-ocean/40 hover:bg-ocean-tint/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean"
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ocean-tint text-ocean">
              <svg
                className="h-4 w-4"
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
            </span>
            <span className="text-[14px] font-medium leading-snug text-foreground">
              {q}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}