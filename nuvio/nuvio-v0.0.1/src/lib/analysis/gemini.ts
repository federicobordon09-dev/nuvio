import { GoogleGenAI } from "@google/genai";
import { parseStudyAnalysis, type StudyAnalysis } from "./schema.ts";

const GEMINI_MODEL = "gemini-3-flash-preview";

const ANALYSIS_TIMEOUT_MS = 30_000;

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

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("La llamada a Gemini excedió el tiempo máximo."));
    }, ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export async function analyzeStudyText(
  extractedText: unknown
): Promise<StudyAnalysis> {
  const text = validateInput(extractedText);

  const apiKey = getApiKey();
  const genai = new GoogleGenAI({ apiKey });

  const response = await withTimeout(
    genai.models.generateContent({
      model: GEMINI_MODEL,
      contents: text,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: ANALYSIS_RESPONSE_SCHEMA,
      },
    }),
    ANALYSIS_TIMEOUT_MS
  );

  const rawOutput = response.text;
  if (!rawOutput) {
    throw new Error("Gemini devolvió una respuesta vacía.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawOutput);
  } catch {
    throw new Error("Gemini devolvió un JSON inválido.");
  }

  return parseStudyAnalysis(parsed);
}
