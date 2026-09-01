import type { ProcessingErrorCode } from "@/lib/studies-utils";

const PDF_EXTRACTION_TIMEOUT_MS = 8_000;

type MupdfModule = typeof import("mupdf");

let mupdfModulePromise: Promise<MupdfModule> | undefined;

function loadMupdf(): Promise<MupdfModule> {
  if (!mupdfModulePromise) {
    // Carga diferida: mupdf (WASM) solo se evalúa cuando realmente se procesa
    // un PDF. Las páginas del dashboard nunca embeben el motor al renderizar.
    mupdfModulePromise = import("mupdf").catch((err) => {
      mupdfModulePromise = undefined;
      throw err;
    });
  }
  return mupdfModulePromise;
}

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
  let mupdf: MupdfModule;
  try {
    mupdf = await loadMupdf();
    // Silencia los avisos nativos de MuPDF (p. ej. reparación de xref).
    try {
      mupdf.setLog(null);
    } catch {
      // Ignorable: la versión del motor puede no exponer setLog.
    }
  } catch (err) {
    console.error("[nuvio:extract-pdf] No se pudo cargar mupdf.", err);
    throw new PdfExtractionError(
      "extraction_failed",
      "No se pudo cargar el motor de extracción de texto."
    );
  }

  try {
    const extractionTask = (async () => {
      const document = mupdf.Document.openDocument(buffer, "application/pdf");
      try {
        const pageCount = document.countPages();
        const parts: string[] = [];

        for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
          const page = document.loadPage(pageIndex);
          let structuredText;
          try {
            structuredText = page.toStructuredText();
            parts.push(structuredText.asText());
          } finally {
            structuredText?.destroy();
            page.destroy();
          }
        }

        let text = parts.join("\n");
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

        return { text, pageCount };
      } finally {
        document.destroy();
      }
    })();

    return await withTimeout(extractionTask, PDF_EXTRACTION_TIMEOUT_MS);
  } catch (err) {
    if (err instanceof PdfExtractionError) {
      throw err;
    }
    throw new PdfExtractionError(
      "invalid_pdf",
      "El archivo no es un PDF válido o está corrupto."
    );
  }
}