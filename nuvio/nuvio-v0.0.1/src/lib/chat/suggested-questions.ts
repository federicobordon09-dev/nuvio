import type { StudyType } from "../studies-utils";

/**
 * Fase 7.1 — Preguntas sugeridas para el Chat IA.
 *
 * Sugerencias determinísticas/locales según el tipo de estudio: ayudan a que
 * un usuario que no sabe qué preguntar descubra qué puede consultar. NO se
 * llama a Gemini para generarlas y hay siempre un fallback (nunca vacío).
 *
 * Reglas:
 * - Lenguaje claro y no técnico.
 * - No hay diagnóstico ni recomendaciones médicas prescriptivas.
 * - Tipos desconocidos → fallback genérico (no se adivina el tipo).
 */

const QUESTIONS: Record<string, string[]> = {
  // Laboratorio / hemograma
  blood_test: [
    "¿Qué significan mis resultados?",
    "¿Hay algún resultado fuera de lo normal?",
    "¿Qué significa el valor más importante?",
    "¿Qué debería revisar con mi médico?",
  ],
  // Electrocardiograma
  ECG: [
    "¿Podés explicarme este resultado?",
    "¿Hay algo fuera de lo normal?",
    "¿Qué significa este resultado?",
    "¿Qué debería consultar con mi médico?",
  ],
  // Imágenes / resonancia / tomografía / radiografía
  MRI: [
    "¿Qué encontró el estudio?",
    "¿Podés explicarme el informe de forma sencilla?",
    "¿Qué partes son las más importantes?",
    "¿Qué debería consultar con mi médico?",
  ],
  CT: [
    "¿Qué encontró el estudio?",
    "¿Podés explicarme el informe de forma sencilla?",
    "¿Qué partes son las más importantes?",
    "¿Qué debería consultar con mi médico?",
  ],
  // Epicrisis / informes médicos generales
  epicrisis: [
    "¿Podés explicarme este informe?",
    "¿Cuáles son los puntos más importantes?",
    "¿Qué debería revisar con mi médico?",
    "¿Qué términos médicos necesito entender?",
  ],
  medical_report: [
    "¿Podés explicarme este informe?",
    "¿Cuáles son los puntos más importantes?",
    "¿Qué debería revisar con mi médico?",
    "¿Qué términos médicos necesito entender?",
  ],
};

const FALLBACK_QUESTIONS = [
  "¿Qué significa este estudio?",
  "¿Cuáles son los puntos más importantes?",
  "¿Hay algo que debería revisar?",
  "¿Podés explicármelo de forma sencilla?",
];

/**
 * Devuelve preguntas sugeridas según el tipo de estudio.
 * Nunca devuelve un array vacío: cualquier tipo desconocido o ausente
 * recibe el conjunto genérico de ayuda.
 */
export function getSuggestedQuestions(
  studyType?: string | null
): string[] {
  if (!studyType) return FALLBACK_QUESTIONS;
  return QUESTIONS[studyType as StudyType] ?? FALLBACK_QUESTIONS;
}