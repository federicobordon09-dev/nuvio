"use client";

import { useState } from "react";

interface StudyExtractionProps {
  text: string;
  pageCount: number | null;
}

/**
 * Acordeón colapsable del contenido extraído.
 *
 * Muestra solo el encabezado ("Contenido extraído · N páginas") y un botón
 * para ver el texto completo dentro de un contenedor con scroll. Es respaldo,
 * no contenido principal; no debe competir visualmente con el análisis.
 */
export function StudyExtraction({ text, pageCount }: StudyExtractionProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-[13px] font-medium text-foreground">
            Contenido extraído
          </h2>
          <p className="truncate text-[12px] text-muted-foreground">
            {pageCount != null
              ? `${pageCount} página${pageCount !== 1 ? "s" : ""} del documento original`
              : "Texto extraído del documento original"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="study-extraction-panel"
          className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-[12px] font-medium text-ocean transition-colors hover:bg-ocean-tint"
        >
          {open ? "Ocultar" : "Ver contenido"}
        </button>
      </div>

      {open && (
        <div
          id="study-extraction-panel"
          className="max-h-[420px] overflow-y-auto border-t border-border px-4 py-4"
        >
          <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-[1.6] text-foreground/80">
            {text}
          </pre>
        </div>
      )}
    </div>
  );
}
