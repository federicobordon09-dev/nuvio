"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface StudyExtractionProps {
  text: string;
  pageCount: number | null;
}

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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="study-extraction-panel"
        >
          {open ? "Ocultar" : "Ver contenido"}
        </Button>
      </div>

      {open && (
        <div
          id="study-extraction-panel"
          role="region"
          aria-label="Contenido extraído del documento"
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
