import { GoogleGenAI } from "@google/genai";
import { parseStudyAnalysis, type StudyAnalysis } from "./schema.ts";

const GEMINI_MODEL = "gemini-3-flash-preview";

/**
 * Timeout máximo para la llamada a Gemini.
 *
 * Debe ser estrictamente menor que el `maxDuration` de Vercel (60 s en Hobby)
 * para que AbortController pueda cancelar la request antes de que la plataforma
 * corte la función. 45 s deja 15 s de margen para Supabase + Zod + persistencia.
 */
export const ANALYSIS_TIMEOUT_MS = 45_000;

// ── Clasificación de errores de Gemini ────────────────────────────

export type GeminiErrorType =
  | "gemini_timeout"
  | "gemini_network"
  | "gemini_api_error"
  | "gemini_invalid_response";

export class GeminiError extends Error {
  readonly type: GeminiErrorType;

  constructor(
    type: GeminiErrorType,
    message: string,
    opts?: { cause?: unknown }
  ) {
    super(message, opts);
    this.name = "GeminiError";
    this.type = type;
  }
}

export function classifyGeminiError(err: unknown): GeminiError {
  if (err instanceof GeminiError) return err;

  const error = err instanceof Error ? err : new Error(String(err));

  // Timeout detectado por AbortController / @google/genai
  if (
    error.name === "AbortError" ||
    error.message.includes("excedió el tiempo máximo") ||
    error.message.includes("timed out") ||
    error.message.includes("abort")
  ) {
    return new GeminiError(
      "gemini_timeout",
      "La llamada a Gemini excedió el tiempo máximo.",
      { cause: error }
    );
  }

  // Errores de red (fetch / conexión)
  const msg = error.message.toLowerCase();
  if (
    msg.includes("fetch failed") ||
    msg.includes("econnrefused") ||
    msg.includes("enetunreach") ||
    msg.includes("etimedout") ||
    msg.includes("econnreset") ||
    msg.includes("network") ||
    msg.includes("enotfound") ||
    (error.name === "TypeError" &&
      (msg.includes("failed") || msg.includes("fetch")))
  ) {
    return new GeminiError(
      "gemini_network",
      `Error de red: ${error.message}`,
      { cause: error }
    );
  }

  // Errores de API (HTTP 4xx/5xx)
  if (
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  ) {
    const status = (error as { status: number }).status;
    return new GeminiError(
      "gemini_api_error",
      `Error de API Gemini (HTTP ${status}): ${error.message}`,
      { cause: error }
    );
  }

  // Fallback para errores inesperados de Gemini
  return new GeminiError(
    "gemini_api_error",
    `Error desconocido de Gemini: ${error.message}`,
    { cause: error }
  );
}

const SYSTEM_PROMPT = `Sos Nuvio, un sistema de explicación de documentos médicos. Tu función es analizar el texto extraído de un documento médico y devolver una explicación estructurada.

Reglas obligatorias:
- Trabajá únicamente con el texto proporcionado como datos.
- No inventes valores, unidades, rangos de referencia, fechas, síntomas, antecedentes, diagnósticos ni medicamentos.
- Si un dato es ambiguo, reflejalo en limitations.
- Si falta información, usá limitations.
- Explicá en español claro y preciso.
- No diagnosticues. No prescribas tratamientos. No indiques cambios de medicación.
- No presentes conclusiones clínicas como certezas cuando el documento no las sustenta.

Nuvio es una herramienta de explicación y orientación informativa. No reemplaza la evaluación de un profesional de la salud.`;

const ANALYSIS_RESPONSE_SCHEMA = {
  type: "object" as const,
  properties: {
    summary: {
      type: "string" as const,
      description: "Explicación breve y clara del documento.",
    },
    document_type: {
      type: "string" as const,
      description: "Tipo de documento identificado.",
    },
    key_findings: {
      type: "array" as const,
      description: "Valores o hallazgos relevantes encontrados.",
      items: {
        type: "object" as const,
        properties: {
          title: {
            type: "string" as const,
            description: "Nombre del hallazgo o valor.",
          },
          value: {
            type: "string" as const,
            description: "Valor encontrado en el documento.",
          },
          unit: {
            type: ["string", "null"] as const,
            description: "Unidad de medida, o null si no aplica.",
          },
          reference_range: {
            type: ["string", "null"] as const,
            description: "Rango de referencia, o null si no está disponible.",
          },
          status: {
            type: "string" as const,
            enum: ["normal", "high", "low", "abnormal", "unknown"] as const,
            description:
              "Estado del valor respecto al rango de referencia.",
          },
          explanation: {
            type: "string" as const,
            description: "Explicación del hallazgo.",
          },
        },
        required: [
          "title",
          "value",
          "unit",
          "reference_range",
          "status",
          "explanation",
        ] as const,
      },
    },
    observations: {
      type: "array" as const,
      description: "Observaciones relevantes para el usuario.",
      items: { type: "string" as const },
    },
    warnings: {
      type: "array" as const,
      description: "Advertencias que merecen atención profesional.",
      items: { type: "string" as const },
    },
    recommendations: {
      type: "array" as const,
      description: "Recomendaciones generales y prudentes.",
      items: { type: "string" as const },
    },
    limitations: {
      type: "array" as const,
      description:
        "Información faltante, ambigüedades o partes no interpretables.",
      items: { type: "string" as const },
    },
  },
  required: [
    "summary",
    "document_type",
    "key_findings",
    "observations",
    "warnings",
    "recommendations",
    "limitations",
  ] as const,
};

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "No se encontró la clave de API de Gemini. Verificá la variable GEMINI_API_KEY."
    );
  }
  return key;
}

function validateInput(text: unknown): string {
  if (typeof text !== "string") {
    throw new Error("El texto de entrada debe ser un string.");
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new Error("El texto de entrada está vacío.");
  }
  return trimmed;
}

/**
 * Interfaz mínima del cliente Gemini que `analyzeStudyText` necesita.
 * Se declara localmente para poder inyectar un doble de prueba sin mockear
 * el módulo `@google/genai` (evita problemas de ESM y mantiene la lógica
 * testable con un stub simple).
 */
export interface GeminiClient {
  models: {
    generateContent(args: unknown): Promise<{ text?: string }>;
  };
}

/**
 * Núcleo de `analyzeStudyText`, separado para permitir inyección del cliente.
 * `createClient` construye el `GoogleGenAI` real; en tests se pasa un stub.
 */
export async function analyzeStudyTextWithClient(
  extractedText: unknown,
  genai: GeminiClient
): Promise<StudyAnalysis> {
  const text = validateInput(extractedText);

  // ── Timeout con AbortController ───────────────────────────────
  // Cancela la request HTTP cuando se excede ANALYSIS_TIMEOUT_MS.
  // @google/genai soporta abortSignal en GenerateContentConfig.
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    ANALYSIS_TIMEOUT_MS
  );

  let response;
  try {
    response = await genai.models.generateContent({
      model: GEMINI_MODEL,
      contents: text,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: ANALYSIS_RESPONSE_SCHEMA,
        abortSignal: controller.signal,
      },
    });
  } catch (err) {
    clearTimeout(timer);
    throw classifyGeminiError(err);
  }
  clearTimeout(timer);

  // ── Validación de la respuesta ────────────────────────────────

  const rawOutput = response.text;
  if (!rawOutput) {
    throw new GeminiError(
      "gemini_invalid_response",
      "Gemini devolvió una respuesta vacía."
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawOutput);
  } catch {
    throw new GeminiError(
      "gemini_invalid_response",
      "Gemini devolvió un JSON inválido."
    );
  }

  try {
    return parseStudyAnalysis(parsed);
  } catch {
    throw new GeminiError(
      "gemini_invalid_response",
      "Gemini devolvió una respuesta que no cumple el schema esperado."
    );
  }
}

/**
 * Entrada pública: construye el cliente `GoogleGenAI` real y delega en
 * `analyzeStudyTextWithClient`. Único punto donde se instancia el SDK.
 */
export async function analyzeStudyText(
  extractedText: unknown
): Promise<StudyAnalysis> {
  const apiKey = getApiKey();
  const genai = new GoogleGenAI({ apiKey });
  // El SDK real expone más parámetros en generateContent; la interfaz mínima
  // es un subconjunto estructural suficiente para el uso interno y los tests.
  return analyzeStudyTextWithClient(
    extractedText,
    genai as unknown as GeminiClient
  );
}
