"use client";

import { Warning, InfoCircle } from "@/components/ui/icons";

interface AnalysisSectionProps {
  title: string;
  items: string[];
  variant?: "default" | "warning" | "info";
  empty?: string;
}

const VARIANTS = {
  default: {
    container: "rounded-xl border border-border bg-surface p-5",
    textClass: "text-foreground/85",
    icon: null,
  },
  warning: {
    container: "rounded-xl border border-warning/30 bg-warning-tint p-5",
    textClass: "text-warning-strong",
    icon: <Warning className="h-5 w-5 text-warning-strong" />,
  },
  info: {
    container: "rounded-xl border border-primary/30 bg-primary-muted p-5",
    textClass: "text-primary-700",
    icon: <InfoCircle className="h-5 w-5 text-primary-600" />,
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
    <section
      className={style.container}
      aria-labelledby={`analysis-section-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <header className="mb-3 flex items-center gap-2">
        {style.icon}
        <h3
          id={`analysis-section-${title.toLowerCase().replace(/\s+/g, "-")}`}
          className="data-label"
        >
          {title}
        </h3>
      </header>

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
    </section>
  );
}
