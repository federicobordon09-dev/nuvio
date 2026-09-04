"use client";

import type { KeyFinding } from "@/lib/analysis/schema";
import { FindingRow } from "./FindingRow";

interface FindingsSectionProps {
  findings: KeyFinding[];
  /** Label contextual (por tipo de estudio) — por defecto "Hallazgos principales". */
  title?: string;
  /** Marca la sección como primaria (jerarquía visual superior). */
  primary?: boolean;
}

/**
 * Sección de hallazgos clínicos principales.
 * Muestra findings en una cuadrícula de 2 columnas.
 */
export function FindingsSection({
  findings,
  title,
  primary,
}: FindingsSectionProps) {
  if (findings.length === 0) return null;

  return (
    <section aria-labelledby="findings-section-heading">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3
          id="findings-section-heading"
          className={`text-[13px] font-semibold uppercase tracking-wide ${
            primary ? "text-primary-600" : "text-muted-foreground"
          }`}
        >
          {title ?? "Hallazgos principales"}
        </h3>
        <span className="text-[12px] text-muted-foreground">
          {findings.length} hallazgo{findings.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {findings.map((finding, index) => (
          <FindingRow key={finding.title || index} finding={finding} />
        ))}
      </div>
    </section>
  );
}
