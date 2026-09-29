"use client";

import { getSuggestedQuestions } from "@/lib/chat/suggested-questions";
import { ChevronRight, QuestionCircle } from "@/components/ui/icons";

interface SuggestedQuestionsProps {
  studyType?: string | null;
  questions?: string[];
  onSelect: (question: string) => void;
  compact?: boolean;
  title?: string;
  subtitle?: string;
}

export function SuggestedQuestions({
  studyType,
  questions: questionsProp,
  onSelect,
  compact = false,
  title = "¿Qué querés saber sobre este estudio?",
  subtitle = "Podés elegir una pregunta o escribir la tuya.",
}: SuggestedQuestionsProps) {
  const questions = questionsProp ?? getSuggestedQuestions(studyType);

  if (questions.length === 0) return null;

  if (compact) {
    return (
      <div className="shrink-0 border-t border-border bg-surface px-4 pb-2 pt-3 sm:px-6">
        <p className="data-label mb-2">También podés preguntar</p>
        <div className="flex flex-wrap gap-2">
          {questions.slice(0, 3).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onSelect(q)}
              className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl border border-border-strong bg-surface px-3.5 py-2 text-left text-caption font-medium text-primary transition-colors duration-150 hover:border-lilac-glow hover:bg-primary-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lilac-glow focus-visible:ring-offset-2"
            >
              <span className="min-w-0 whitespace-normal">{q}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-plum-muted" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-5 pt-5 sm:px-6">
      <h2 className="text-subheading text-primary">{title}</h2>
      <p className="mt-1 text-caption text-muted-foreground">{subtitle}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {questions.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onSelect(q)}
            className="flex min-h-11 items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 text-left transition-colors duration-150 hover:border-lilac-glow hover:bg-primary-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lilac-glow focus-visible:ring-offset-2"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary-muted text-primary"
            >
              <QuestionCircle className="h-4 w-4" />
            </span>
            <span className="text-body font-medium leading-snug text-foreground">
              {q}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
