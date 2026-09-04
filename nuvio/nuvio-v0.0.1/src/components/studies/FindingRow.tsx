"use client";

import { useState } from "react";
import type { KeyFinding, FindingStatus } from "@/lib/analysis/schema";
import { StudyChatCta } from "@/components/chat/StudyChatCta";
import { buildStudyChatPrompt } from "@/lib/chat/study-chat-cta";

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
 * Fila de hallazgo clínico en el panel de resultados.
 *
 * Representa una observación clínica (sin valor numérico). Muestra el
 * título, un badge opcional de importancia, y una explicación que se
 * expande individualmente ("Ver más"). Los valores numéricos/mediciones
 * se representan por separado en la sección de measurements.
 */
export function FindingRow({
  finding,
  studyId,
}: {
  finding: KeyFinding;
  /** ID del estudio, para el CTA contextual "Preguntar sobre este hallazgo". */
  studyId: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="min-w-0 text-[14px] font-medium leading-snug text-foreground">
          {finding.title}
        </h4>
        {finding.importance && (
          <FindingStatusBadge status={finding.importance} />
        )}
      </div>

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
            className="mt-1 min-h-[44px] py-2 text-[12px] font-medium text-ocean transition-colors hover:text-ocean-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean"
            aria-expanded={expanded}
          >
            {expanded ? "Ver menos" : "Ver más"}
          </button>
        </div>
      )}

      {/* CTA contextual: preguntar sobre este hallazgo */}
      <StudyChatCta
        studyId={studyId}
        label="Preguntar sobre este hallazgo"
        prompt={buildStudyChatPrompt({ kind: "finding", finding })}
        compact
      />
    </div>
  );
}
