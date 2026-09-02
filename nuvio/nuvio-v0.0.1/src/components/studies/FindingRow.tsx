"use client";

import { useState } from "react";
import type { KeyFinding, FindingStatus } from "@/lib/analysis/schema";

// ── Status labels & colors (semánticos) ───────────────────────

const STATUS_LABELS: Record<FindingStatus, string> = {
  normal: "Normal",
  high: "Elevado",
  low: "Bajo",
  abnormal: "Anormal",
  unknown: "Sin datos",
};

const STATUS_STYLES: Record<FindingStatus, string> = {
  normal: "bg-success-tint text-success-strong",
  high: "bg-danger-tint text-danger-strong",
  low: "bg-warning-tint text-warning-strong",
  abnormal: "bg-warning-tint text-warning-strong",
  unknown: "bg-muted text-muted-foreground",
};

const STATUS_DOT: Record<FindingStatus, string> = {
  normal: "bg-success",
  high: "bg-danger",
  low: "bg-warning",
  abnormal: "bg-warning",
  unknown: "bg-muted-foreground",
};

function FindingStatusBadge({ status }: { status: FindingStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.unknown;
  const dot = STATUS_DOT[status] ?? STATUS_DOT.unknown;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${style}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/**
 * Fila de hallazgo en el panel de resultados.
 *
 * Compacta: título + badge, valor en mono, rango de referencia, y una
 * explicación de 1–2 líneas que se expande individualmente ("Ver más") sin
 * agrandar todo el grid. Funciona con 2, 8 o 20+ hallazgos.
 */
export function FindingRow({
  finding,
}: {
  finding: KeyFinding;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="min-w-0 text-[14px] font-medium leading-snug text-foreground">
          {finding.title}
        </h4>
        <FindingStatusBadge status={finding.status} />
      </div>

      <p className="font-mono text-[22px] font-medium leading-none tracking-tight text-foreground">
        {finding.value}
        {finding.unit && (
          <span className="ml-1.5 font-sans text-[12px] font-normal text-muted-foreground">
            {finding.unit}
          </span>
        )}
      </p>

      {finding.reference_range && (
        <p className="text-[12px] text-muted-foreground">
          Ref. {finding.reference_range}
        </p>
      )}

      {finding.explanation && (
        <div className="mt-auto pt-1">
          <p
            className={`text-[13px] leading-[1.55] text-foreground/80 ${
              expanded ? "" : "line-clamp-2"
            }`}
          >
            {finding.explanation}
          </p>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-[12px] font-medium text-ocean transition-colors hover:text-ocean-dark"
            aria-expanded={expanded}
          >
            {expanded ? "Ver menos" : "Ver más"}
          </button>
        </div>
      )}
    </div>
  );
}
