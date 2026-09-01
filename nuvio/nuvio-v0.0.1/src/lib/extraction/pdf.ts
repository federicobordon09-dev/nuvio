import { PDFParse } from "pdf-parse";
import type { ProcessingErrorCode } from "@/lib/studies-utils";

const PDF_EXTRACTION_TIMEOUT_MS = 8_000;

export class PdfExtractionError extends Error {
  readonly code: ProcessingErrorCode;

  constructor(code: ProcessingErrorCode, message: string) {
    super(message);
    this.name = "PdfExtractionError";
    this.code = code;
  }
}

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new PdfExtractionError(
          "extraction_failed",
          "La extracción de texto excedió el tiempo máximo permitido."
        )
      );
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

export async function extractPdfText(
  buffer: Uint8Array
): Promise<PdfExtractionResult> {
  let parser: PDFParse | null = null;

  try {
    const extractionTask = (async () => {
      parser = new PDFParse({
        data: buffer,
        useWorkerFetch: false,
        useWasm: false,
        isEvalSupported: false,
        disableFontFace: true,
      });
      return parser.getText({ pageJoiner: "" });
    })();

    const result = await withTimeout(extractionTask, PDF_EXTRACTION_TIMEOUT_MS);

    let text = result.text ?? "";
    text = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\u0000/g, "")
      .trim();

    if (text.length === 0) {
      throw new PdfExtractionError(
        "ocr_required",
        "El PDF no contiene texto extraíble; requiere OCR."
      );
    }

    return { text, pageCount: result.total ?? 1 };
  } catch (err) {
    if (err instanceof PdfExtractionError) {
      throw err;
    }
    throw new PdfExtractionError(
      "invalid_pdf",
      "El archivo no es un PDF válido o está corrupto."
    );
  } finally {
    queueMicrotask(() => {
      parser?.destroy().catch(() => {});
    });
  }
}