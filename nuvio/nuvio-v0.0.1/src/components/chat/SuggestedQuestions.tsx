"use client";

import { motion } from "motion/react";
import { getSuggestedQuestions } from "@/lib/chat/suggested-questions";
import { ChevronRight, QuestionCircle } from "@/components/ui/icons";
import { fadeInUp, scaleInSpring, getViewportOptions, STAGGER } from "@/lib/animation";

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
      <motion.div
        className="shrink-0 border-t border-border bg-surface px-4 pb-2 pt-3 sm:px-6"
        initial="hidden"
        animate="visible"
        viewport={getViewportOptions()}
        variants={{ staggerChildren: STAGGER.tight }}
      >
        <motion.p className="data-label mb-2" variants={fadeInUp}>
          También podés preguntar
        </motion.p>
        <motion.div className="flex flex-wrap gap-2" variants={{ staggerChildren: STAGGER.tight }}>
          {questions.slice(0, 3).map((q, index) => (
            <motion.button
              key={q}
              type="button"
              onClick={() => onSelect(q)}
              className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-xl border border-border-strong bg-surface px-3.5 py-2 text-left text-caption font-medium text-primary transition-colors duration-150 hover:border-lilac-glow hover:bg-primary-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lilac-glow focus-visible:ring-offset-2"
              variants={scaleInSpring}
              style={{ animationDelay: `${index * STAGGER.tight * 1000}ms` }}
              whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="min-w-0 whitespace-normal">{q}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-plum-muted" />
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="px-4 pb-5 pt-5 sm:px-6"
      initial="hidden"
      animate="visible"
      viewport={getViewportOptions()}
      variants={{ staggerChildren: STAGGER.section }}
    >
      <motion.h2 className="text-subheading text-primary" variants={fadeInUp}>
        {title}
      </motion.h2>
      <motion.p className="mt-1 text-caption text-muted-foreground" variants={fadeInUp}>
        {subtitle}
      </motion.p>
      <motion.div className="mt-4 grid gap-3 sm:grid-cols-2" variants={{ staggerChildren: STAGGER.tight }}>
        {questions.map((q, index) => (
          <motion.button
            key={q}
            type="button"
            onClick={() => onSelect(q)}
            className="flex min-h-11 items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 text-left transition-colors duration-150 hover:border-lilac-glow hover:bg-primary-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lilac-glow focus-visible:ring-offset-2"
            variants={scaleInSpring}
            style={{ animationDelay: `${index * STAGGER.tight * 1000}ms` }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
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
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}