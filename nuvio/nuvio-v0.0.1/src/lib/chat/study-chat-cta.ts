import type { KeyFinding, Measurement } from "@/lib/analysis/schema";

/**
 * Fase 8.4 — CTA contextual hacia el Chat IA.
 *
 * Helper puro que construye el "mensaje / sugerencia inicial" que acompaña a
 * una conversación creada desde un CTA de la pantalla de resultados.
 *
 * Reglas:
 * - SOLO refleja datos que ya existen en el análisis. NO genera interpretación
 *   médica, NO afirma normalidad/anormalidad/gravedad y NO diagnostica.
 * - No incluye `status`, `reference_range` ni ninguna conclusión derivada.
 * - El `study_id` y la autorización se manejan server-side (no se confía en el
 *   cliente): este helper solo produce una sugerencia conversacional.
 */

/** Prompt por defecto cuando el foco es el estudio completo. */
export const STUDY_CHAT_PROMPT = "Quiero entender mejor este estudio.";

/** Límite defensivo del prompt contextual en la URL de la conversación. */
export const MAX_STUDY_CHAT_PROMPT_LENGTH = 300;

/**
 * Foco del CTA contextual: qué elemento de la pantalla de resultados originó
 * la navegación hacia el Chat.
 */
export type StudyChatFocus =
  | { kind: "study" }
  | { kind: "finding"; finding: KeyFinding }
  | { kind: "measurement"; measurement: Measurement };

/**
 * Construye la sugerencia inicial contextual para el Chat IA.
 *
 * - study → "Quiero entender mejor este estudio."
 * - finding → "Quiero entender mejor este hallazgo: <título>."
 * - measurement → "Quiero entender mejor este valor: <nombre> = <valor> <unidad>."
 *
 * Devuelve `null` cuando no hay información suficiente para armar una sugerencia
 * útil (p.ej. una medición sin nombre). El CTA igual abre el chat con el estudio
 * como contexto, simplemente sin sugerencia inicial.
 */
export function buildStudyChatPrompt(focus: StudyChatFocus): string | null {
  if (focus.kind === "study") {
    return STUDY_CHAT_PROMPT;
  }

  let prompt: string;

  if (focus.kind === "finding") {
    const title = focus.finding.title?.trim();
    if (!title) return STUDY_CHAT_PROMPT;
    prompt = `Quiero entender mejor este hallazgo: ${title}.`;
  } else {
    const measurement = focus.measurement;
    const name = measurement.name?.trim();
    if (!name) return null;

    const value = measurement.value?.trim();
    const unit = measurement.unit?.trim();

    if (!value) {
      prompt = `Quiero entender mejor este valor: ${name}.`;
    } else {
      const valuePart = unit ? `${value} ${unit}` : value;
      prompt = `Quiero entender mejor este valor: ${name} = ${valuePart}.`;
    }
  }

  // Recorta por seguridad (títulos/nombres patológicamente largos): el prompt
  // se propaga como query param de la URL de la conversación.
  return prompt.slice(0, MAX_STUDY_CHAT_PROMPT_LENGTH);
}
