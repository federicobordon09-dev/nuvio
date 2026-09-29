"use client";

import { Warning, InfoCircle } from "@/components/ui/icons";
import { SectionAccordion } from "./SectionAccordion";

interface AnalysisSectionProps {
  title: string;
  items: string[];
  variant?: "default" | "warning" | "info";
  empty?: string;
}

/**
 * Panel de listas del análisis (observaciones / advertencias /
 * recomendaciones / limitaciones). El tintado semántico vive en el
 * contenido; el chip del título usa el acento lila del sistema.
 */
const VARIANTS = {
  default: {
    panel: "bg-background",
    textClass: "text-foreground/85",
    icon: null,
  },
  warning: {
    panel: "bg-warning-tint border border-warning/20",
    textClass: "text-warning-strong",
    icon: <Warning className="h-4 w-4" />,
  },
  info: {
    panel: "bg-primary-muted border border-primary/30",
    textClass: "text-primary",
    icon: <InfoCircle className="h-4 w-4" />,
  },
};

export function AnalysisSection({
  title,
  items,
  variant = "default",
  empty,
}: AnalysisSectionProps) {
  if (items.length === 0 && !empty) return null;

  const style = VARIANTS[variant];

  return (
    <SectionAccordion title={title} icon={style.icon ?? undefined}>
      <div className={`rounded-xl p-4 ${style.panel}`}>
        {items.length === 0 && empty ? (
          <p className={`text-body ${style.textClass}`}>{empty}</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li key={index} className={`text-body ${style.textClass}`}>
                <span className="inline-flex items-start gap-2">
                  <span
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SectionAccordion>
  );
}
