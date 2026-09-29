"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "@/components/ui/icons";

interface SectionAccordionProps {
  /** Título de la sección (frase, sin mayúsculas forzadas). */
  title: string;
  /** Contador opcional, p. ej. "3 hallazgos". Solo texto real del payload. */
  countLabel?: string;
  /** Resalta el título con el tono primario (sección protagonista). */
  primary?: boolean;
  /** Icono opcional al inicio del título. */
  icon?: ReactNode;
  /** Abierta por defecto: el contenido sigue visible sin interacción. */
  defaultOpen?: boolean;
  children: ReactNode;
}

/**
 * Card-acordeón de sección (DESIGN.md → Medical Summary Cards & Accordions):
 * fondo blanco, radio 20px, borde hairline, toggle circular lila con chevron
 * que rota, e hilo lila de 2px en el borde izquierdo del contenido.
 *
 * El panel SIEMPRE está en el DOM (toggle con `hidden`) para que
 * `aria-controls` apunte a un nodo real en ambos estados.
 */
export function SectionAccordion({
  title,
  countLabel,
  primary = false,
  icon,
  defaultOpen = true,
  children,
}: SectionAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const baseId = useId();
  const headingId = `${baseId}-heading`;
  const panelId = `${baseId}-panel`;

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-[20px] border border-border bg-surface"
    >
      <h3 id={headingId} className="m-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-h-[44px] w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lilac-glow focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-6"
        >
          <span className="flex min-w-0 flex-1 items-center gap-3">
            {icon && (
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary"
              >
                {icon}
              </span>
            )}
            <span className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
              <span
                className={`text-subheading ${
                  primary ? "text-primary" : "text-foreground"
                }`}
              >
                {title}
              </span>
              {countLabel && (
                <span className="text-caption font-medium text-muted-foreground tabular-nums">
                  {countLabel}
                </span>
              )}
            </span>
          </span>
          <span
            aria-hidden="true"
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-muted text-primary transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          >
            <ChevronDown className="h-4 w-4" />
          </span>
        </button>
      </h3>

      <div
        id={panelId}
        role="region"
        aria-labelledby={headingId}
        hidden={!open}
        className="px-5 pb-5 sm:px-6"
      >
        <div className="border-l-2 border-primary-muted pl-4">{children}</div>
      </div>
    </section>
  );
}
