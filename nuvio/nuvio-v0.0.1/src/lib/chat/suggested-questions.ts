import type { StudyType } from "../studies-utils";

/**
 * Fase 7.1 — Preguntas sugeridas para el Chat IA.
 *
 * Pool amplio de preguntas determinísticas/locales por tipo de estudio.
 * El hook `useSuggestedQuestions` consume estos pools para rotar sugerencias
 * durante la conversación. `getSuggestedQuestions` se mantiene como fallback
 * puro (sin estado).
 *
 * Reglas:
 * - Lenguaje claro y no técnico.
 * - No hay diagnóstico ni recomendaciones médicas prescriptivas.
 * - Tipos desconocidos → fallback genérico (no se adivina el tipo).
 * - Cada pool tiene 8-10 preguntas para permitir rotación sin repetición.
 */

export const QUESTIONS: Record<string, string[]> = {
  // ── Laboratorio / hemograma ─────────────────────────────────────
  blood_test: [
    "¿Qué significan mis resultados?",
    "¿Hay algún resultado fuera de lo normal?",
    "¿Qué significa el valor más importante?",
    "¿Qué debería revisar con mi médico?",
    "¿Podés explicarme este análisis en palabras simples?",
    "¿Qué hay que tener en cuenta de estos resultados?",
    "¿Qué preguntas sería útil hacerle a mi médico?",
    "¿Qué información de este análisis conviene llevar a la consulta?",
    "¿Hay algún valor que requiera atención urgente?",
    "¿Qué significan los valores que están fuera de rango?",
  ],
  // ── Electrocardiograma ──────────────────────────────────────────
  ECG: [
    "¿Podés explicarme este resultado?",
    "¿Hay algo fuera de lo normal?",
    "¿Qué significa este resultado?",
    "¿Qué debería consultar con mi médico?",
    "¿Qué indica este electrocardiograma en términos simples?",
    "¿Hay algún hallazgo que deba prestarle atención?",
    "¿Qué términos médicos del informe necesito entender?",
    "¿Es necesario hacer un seguimiento de este resultado?",
    "¿Qué significa el ritmo que se describe en el informe?",
    "¿Hay algo que debería mencionarle a mi médico en la próxima consulta?",
  ],
  // ── Resonancia magnética ────────────────────────────────────────
  MRI: [
    "¿Qué encontró el estudio?",
    "¿Podés explicarme el informe de forma sencilla?",
    "¿Qué partes son las más importantes?",
    "¿Qué debería consultar con mi médico?",
    "¿Qué hallazgos menciona el informe?",
    "¿Hay algo que deba prestarle especial atención?",
    "¿Qué términos médicos del informe necesito entender?",
    "¿Qué zonas del cuerpo fueron evaluadas en este estudio?",
    "¿Hay algún resultado que requiera seguimiento?",
    "¿Qué preguntas sería útil hacerle a mi médico sobre este estudio?",
  ],
  // ── Tomografía computarizada ────────────────────────────────────
  CT: [
    "¿Qué encontró el estudio?",
    "¿Podés explicarme el informe de forma sencilla?",
    "¿Qué partes son las más importantes?",
    "¿Qué debería consultar con mi médico?",
    "¿Qué hallazgos menciona el informe?",
    "¿Hay algo que deba prestarle especial atención?",
    "¿Qué términos médicos del informe necesito entender?",
    "¿Qué zonas del cuerpo fueron evaluadas en esta tomografía?",
    "¿Hay algún resultado que requiera seguimiento?",
    "¿Qué preguntas sería útil hacerle a mi médico sobre este estudio?",
  ],
  // ── Epicrisis / informe de egreso ───────────────────────────────
  epicrisis: [
    "¿Podés explicarme este informe?",
    "¿Cuáles son los puntos más importantes?",
    "¿Qué debería revisar con mi médico?",
    "¿Qué términos médicos necesito entender?",
    "¿Cuáles fueron los diagnósticos principales?",
    "¿Qué tratamiento se indicó al alta?",
    "¿Hay instrucciones de seguimiento que deba seguir?",
    "¿Qué medicación se me recetó y para qué sirve?",
    "¿Hay signos de alarma que deba vigilar?",
    "¿Qué preguntas sería útil hacer en la consulta de seguimiento?",
  ],
  // ── Informe médico general ──────────────────────────────────────
  medical_report: [
    "¿Podés explicarme este informe?",
    "¿Cuáles son los puntos más importantes?",
    "¿Qué debería revisar con mi médico?",
    "¿Qué términos médicos necesito entender?",
    "¿Qué hallazgos principales menciona el informe?",
    "¿Hay alguna recomendación que deba tener en cuenta?",
    "¿Qué estudios o controles se sugieren?",
    "¿Hay algo que deba consultar con urgencia?",
    "¿Qué preguntas sería útil hacer en la próxima consulta?",
    "¿Qué información del informe conviene llevar al médico?",
  ],
};

export const FALLBACK_QUESTIONS: string[] = [
  "¿Qué significa este estudio?",
  "¿Cuáles son los puntos más importantes?",
  "¿Hay algo que debería revisar?",
  "¿Podés explicármelo de forma sencilla?",
  "¿Qué términos médicos necesito entender?",
  "¿Qué debería consultar con mi médico?",
  "¿Hay algún hallazgo que deba prestarle atención?",
  "¿Qué preguntas sería útil hacer en la consulta?",
];

/**
 * Devuelve preguntas sugeridas según el tipo de estudio (fallback puro).
 * Para la rotación dinámica, usar `useSuggestedQuestions`.
 */
export function getSuggestedQuestions(
  studyType?: string | null
): string[] {
  if (!studyType) return FALLBACK_QUESTIONS;
  return QUESTIONS[studyType as StudyType] ?? FALLBACK_QUESTIONS;
}
