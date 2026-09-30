"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import type { StudyStats } from "@/lib/studies-utils";
import { CheckCircle, Clock, Document, Warning } from "@/components/ui/icons";
import {
  fadeInUp,
  scaleInSpring,
  getViewportOptions,
  STAGGER,
} from "@/lib/animation";

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

const METRIC_CLASS =
  "font-heading text-[1.75rem] font-bold leading-8 tracking-[-0.02em] tabular-nums text-primary";

function StatItem({
  label,
  iconTone,
  icon,
  value,
  totalLabel,
  index,
}: {
  label: string;
  iconTone: string;
  icon: ReactNode;
  value: number;
  totalLabel: string;
  index: number;
}) {
  return (
    <motion.li
      className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow duration-150 hover:shadow-md"
      variants={fadeInUp}
      viewport={getViewportOptions()}
      style={{ animationDelay: `${index * STAGGER.section * 1000}ms` }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <motion.div
        className="flex items-start justify-between gap-2"
        variants={fadeInUp}
        style={{ animationDelay: "0ms" }}
      >
        <span className="text-caption text-muted-foreground">{label}</span>
        <motion.span
          aria-hidden="true"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${iconTone}`}
          variants={scaleInSpring}
          whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
        >
          {icon}
        </motion.span>
      </motion.div>

      <motion.div
        className="flex flex-wrap items-baseline gap-x-2 gap-y-1"
        variants={fadeInUp}
        style={{ animationDelay: "75ms" }}
      >
        <motion.span
          className={METRIC_CLASS}
          variants={scaleInSpring}
        >
          {value}
        </motion.span>
        <span className="text-caption text-muted-foreground">{totalLabel}</span>
      </motion.div>
    </motion.li>
  );
}

export function StudyStatsGrid({ stats }: { stats: StudyStats }) {
  const totalLabel = `de ${stats.total} ${stats.total === 1 ? "estudio" : "estudios"}`;

  return (
    <motion.section
      aria-label="Resumen de estudios"
      className="mb-10"
      initial="hidden"
      animate="visible"
      viewport={getViewportOptions()}
      variants={{ staggerChildren: STAGGER.section }}
    >
      <motion.ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_ITEMS.map((item, index) => (
          <StatItem
            key={item.key}
            {...item}
            value={stats[item.key]}
            totalLabel={totalLabel}
            index={index}
          />
        ))}
      </motion.ul>
    </motion.section>
  );
}