"use client";

import { useCallback, useMemo, useState } from "react";
import type { ChatMessage } from "./schema";
import { QUESTIONS, FALLBACK_QUESTIONS } from "./suggested-questions";

const MAX_VISIBLE = 4;

/**
 * Hook de rotación de preguntas sugeridas.
 *
 * Mantiene un pool por tipo de estudio y un set de preguntas usadas.
 * Cuando el usuario selecciona una pregunta, se marca como usada y se
 * reemplaza por una nueva del pool (si hay disponibles).
 *
 * Las preguntas usadas se reconstruyen a partir de los mensajes existentes
 * al inicio de la sesión (sin persistencia adicional en DB).
 */
export function useSuggestedQuestions(
  studyType: string | null | undefined,
  messages: ChatMessage[]
) {
  const [pool, setPool] = useState<string[]>(FALLBACK_QUESTIONS);
  const [used, setUsed] = useState<Set<string>>(new Set());
  const [prevStudy, setPrevStudy] = useState<
    string | null | undefined
  >(undefined);

  // Inicializar o resetear cuando cambia el study type.
  if (prevStudy !== studyType) {
    setPrevStudy(studyType);
    const newPool = studyType
      ? (QUESTIONS[studyType] ?? FALLBACK_QUESTIONS)
      : FALLBACK_QUESTIONS;
    setPool(newPool);

    // Reconocer preguntas usadas a partir de mensajes existentes.
    const userTexts = new Set(
      messages
        .filter((m) => m.role === "user")
        .map((m) => m.content.trim())
    );
    const newUsed = new Set(newPool.filter((q) => userTexts.has(q)));
    setUsed(newUsed);
  }

  const visible = useMemo(
    () => pool.filter((q) => !used.has(q)).slice(0, MAX_VISIBLE),
    [pool, used]
  );

  const markUsed = useCallback(
    (question: string) => {
      setUsed((prev) => {
        const next = new Set(prev);
        next.add(question);
        return next;
      });
    },
    []
  );

  return { visible, markUsed, hasQuestions: visible.length > 0 };
}
