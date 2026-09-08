"use client";

import { getSuggestedQuestions } from "@/lib/chat/suggested-questions";
import { QuestionCircle } from "@/components/ui/icons";

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
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-left text-[12px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <QuestionCircle className="h-3.5 w-3.5 shrink-0 text-primary" />
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
            className="flex items-start gap-2.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary">
              <QuestionCircle className="h-4 w-4" />
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
