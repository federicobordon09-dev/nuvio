"use client";

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
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="h-5 w-5 text-warning-strong"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    ),
  },
  info: {
    container: "rounded-xl border border-primary/30 bg-primary-50 p-5",
    textClass: "text-primary-700",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="h-5 w-5 text-primary-600"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
        />
      </svg>
    ),
  },
};

/**
 * Sección genérica de lista (observaciones, advertencias, recomendaciones, limitaciones).
 * Con variantes visuales para dar jerarquía a la información.
 */
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
          className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {title}
        </h3>
      </header>

      {items.length === 0 && empty ? (
        <p className={`text-[14px] leading-[1.6] ${style.textClass}`}>{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className={`text-[14px] leading-[1.6] ${style.textClass}`}>
              <span className="inline-flex items-center gap-2">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400"
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
