"use client";

import { useId, useState } from "react";
import type { KeyFinding, FindingStatus } from "@/lib/analysis/schema";
import { StudyChatCta } from "@/components/chat/StudyChatCta";
import { buildStudyChatPrompt } from "@/lib/chat/study-chat-cta";

const STATUS_LABELS: Record<FindingStatus, string> = {
  normal: "Normal",
  high: "Elevado",
  low: "Bajo",
  abnormal: "Requiere atención",
  unknown: "Sin datos",
};

const STATUS_STYLES: Record<FindingStatus, string> = {
  normal: "bg-success-tint text-success-strong",
  high: "bg-warning-tint text-warning-strong",
  low: "bg-info-tint text-info",
  abnormal: "bg-danger-tint text-danger-strong",
  unknown: "bg-muted text-muted-foreground",
};

const STATUS_DOT: Record<FindingStatus, string> = {
  normal: "bg-success",
  high: "bg-warning",
  low: "bg-info",
  abnormal: "bg-danger",
  unknown: "bg-muted-foreground",
};

/**
 * Badge de estado (DESIGN.md → Medical Status Badges & Chips):
 * pill `rounded-full`, padding 4px 12px, label-sm (11/600/16/0.04em).
 * El texto siempre nombra el estado: el color nunca es la única señal.
 */
function FindingStatusBadge({ status }: { status: FindingStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.unknown;
  const dot = STATUS_DOT[status] ?? STATUS_DOT.unknown;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold leading-4 tracking-[0.04em] ${style}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${dot}`}
      />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function FindingRow({
  finding,
  studyId,
}: {
  finding: KeyFinding;
  studyId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const explanationId = useId();

  return (
    <article className="flex flex-col gap-2 rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="min-w-0 text-body font-semibold text-primary">
          {finding.title}
        </h4>
        {finding.importance && (
          <FindingStatusBadge status={finding.importance} />
        )}
      </div>

      {finding.explanation && (
        <div className="mt-auto pt-1">
          <p
            id={explanationId}
            className={`text-body leading-body text-foreground/85 ${
              expanded ? "" : "line-clamp-3"
            }`}
          >
            {finding.explanation}
          </p>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 min-h-[44px] px-1 py-2 text-caption font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lilac-glow"
            aria-expanded={expanded}
            aria-controls={explanationId}
          >
            {expanded ? "Ver menos" : "Ver más"}
          </button>
        </div>
      )}

      <StudyChatCta
        studyId={studyId}
        label="Preguntar sobre este hallazgo"
        prompt={buildStudyChatPrompt({ kind: "finding", finding })}
        compact
      />
    </article>
  );
}
