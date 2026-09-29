import type { ReactNode } from "react";
import type { StudyStats } from "@/lib/studies-utils";
import { CheckCircle, Clock, Document, Warning } from "@/components/ui/icons";

/**
 * Fila de métricas del dashboard. Todos los números son conteos reales
 * devueltos por `getStudyStats` / `computeStudyStats` — nunca valores fijos.
 */
const STAT_ITEMS: Array<{
  key: keyof StudyStats;
  label: string;
  iconTone: string;
  icon: ReactNode;
}> = [
  {
    key: "ready",
    label: "Estudios listos",
    iconTone: "bg-success-tint text-success",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  {
    key: "in_progress",
    label: "En procesamiento",
    iconTone: "bg-primary-muted text-primary",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    key: "pending",
    label: "Pendientes",
    iconTone: "bg-muted text-muted-foreground",
    icon: <Document className="h-4 w-4" />,
  },
  {
    key: "errors",
    label: "Con errores",
    iconTone: "bg-danger-tint text-danger",
    icon: <Warning className="h-4 w-4" />,
  },
];

/** data-metric: Plus Jakarta Sans 28/32, -0.02em, 700, tabular-nums. */
const METRIC_CLASS =
  "font-heading text-[1.75rem] font-bold leading-8 tracking-[-0.02em] tabular-nums text-primary";

export function StudyStatsGrid({ stats }: { stats: StudyStats }) {
  const totalLabel = `de ${stats.total} ${stats.total === 1 ? "estudio" : "estudios"}`;

  return (
    <section aria-label="Resumen de estudios" className="mb-10">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_ITEMS.map((item) => (
          <li
            key={item.key}
            className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow duration-150 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-caption text-muted-foreground">
                {item.label}
              </span>
              <span
                aria-hidden="true"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${item.iconTone}`}
              >
                {item.icon}
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className={METRIC_CLASS}>{stats[item.key]}</span>
              <span className="text-caption text-muted-foreground">
                {totalLabel}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
