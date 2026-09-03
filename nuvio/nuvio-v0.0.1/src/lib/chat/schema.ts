import { z } from "zod";

/**
 * Fase 7.2 — Contrato de datos del Chat IA.
 *
 * Define los tipos y las validaciones de entrada/salida del módulo de chat.
 * NO implementa lógica de IA ni acceso a datos; solo el contrato validable.
 *
 * Reglas de seguridad:
 * - El texto del usuario es dato no confiable (puede contener intentos de
 *   inyección de prompt). Se valida con límites estrictos de longitud.
 * - Los IDs de conversación/estudio nunca se confían al cliente para
 *   autorización: la verificación de ownership ocurre server-side.
 */

export const CHAT_ROLES = ["user", "assistant"] as const;
export type ChatRole = (typeof CHAT_ROLES)[number];

export const chatRoleSchema = z.enum(CHAT_ROLES);

// ── Límites ───────────────────────────────────────────────────

/** Longitud máxima de un mensaje del usuario. */
export const MAX_MESSAGE_LENGTH = 8000;

/** Longitud máxima del título de una conversación. */
export const MAX_CONVERSATION_TITLE_LENGTH = 120;

/** Cantidad máxima de estudios vinculados como contexto de una conversación. */
export const MAX_CONTEXT_STUDIES = 10;

// ── Validación de entrada del usuario ─────────────────────────

/**
 * Esquema del mensaje que envía el usuario. El texto se recorta y se
 * verifica que no esté vacío ni supere el límite.
 */
export const userMessageInputSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Escribí un mensaje.")
    .max(
      MAX_MESSAGE_LENGTH,
      `El mensaje no puede superar los ${MAX_MESSAGE_LENGTH} caracteres.`
    ),
});

export type UserMessageInput = z.infer<typeof userMessageInputSchema>;

/**
 * Esquema de título de conversación (opcional, usado al renombrar).
 */
export const conversationTitleSchema = z
  .string()
  .trim()
  .min(1, "El título no puede estar vacío.")
  .max(
    MAX_CONVERSATION_TITLE_LENGTH,
    `El título no puede superar los ${MAX_CONVERSATION_TITLE_LENGTH} caracteres.`
  );

// ── Tipos de fila de DB ───────────────────────────────────────

export interface ChatConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
}

export interface ChatContext {
  id: string;
  conversation_id: string;
  study_id: string;
  user_id: string;
  created_at: string;
}

/**
 * Estudio enriquecido con la info mínima para mostrarlo como contexto
 * seleccionable en la UI del chat.
 */
export interface SelectableStudy {
  id: string;
  file_name: string;
  study_type: string;
  status: string;
  analysis_status: string;
  /** Fecha de carga del estudio, para mostrarla en las tarjetas (opcional). */
  created_at?: string | null;
}
