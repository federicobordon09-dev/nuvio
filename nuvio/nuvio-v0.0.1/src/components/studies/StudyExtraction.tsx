"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChevronDown } from "@/components/ui/icons";

interface StudyExtractionProps {
  text: string;
  pageCount: number | null;
}

/**
 * Panel del texto extraído del documento original.
 * Acordeón colapsado por defecto con `aria-expanded` / `aria-controls`.
 */
export function StudyExtraction({ text, pageCount }: StudyExtractionProps) {
  const [open, setOpen] = useState(false);

  return (
    <section
      aria-labelledby="study-extraction-heading"
      className="rounded-[20px] border border-border bg-surface"
    >
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <h2
            id="study-extraction-heading"
            className="text-subheading text-primary"
          >
            Contenido extraído
          </h2>
          <p className="mt-0.5 text-caption text-muted-foreground">
            {pageCount != null
              ? `${pageCount} página${pageCount !== 1 ? "s" : ""} del documento original`
              : "Texto extraído del documento original"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="study-extraction-panel"
          className="min-h-[44px] shrink-0"
        >
          <ChevronDown
            aria-hidden="true"
            className={`h-4 w-4 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
          {open ? "Ocultar" : "Ver contenido"}
        </Button>
      </div>

      <div
        id="study-extraction-panel"
        role="region"
        aria-labelledby="study-extraction-heading"
        hidden={!open}
        className="border-t border-border px-5 py-4"
      >
        <div className="max-h-[420px] overflow-y-auto">
          <pre className="whitespace-pre-wrap break-words font-mono text-caption leading-body text-foreground/80">
            {text}
          </pre>
        </div>
      </div>
    </section>
  );
}
