"use client";

import type { Measurement, MeasurementStatus } from "@/lib/analysis/schema";
import { getMeasurementSignificance, getStatusLabel } from "@/lib/analysis/measurement-significance";
import { StudyChatCta } from "@/components/chat/StudyChatCta";
import { buildStudyChatPrompt } from "@/lib/chat/study-chat-cta";

interface MeasurementsSectionProps {
  measurements: Measurement[];
  title?: string;
  primary?: boolean;
  studyId: string;
}

const STATUS_STYLES: Record<MeasurementStatus, string> = {
  within_range: "bg-success-tint text-success-strong",
  above_range: "bg-warning-tint text-warning-strong",
  below_range: "bg-warning-tint text-warning-strong",
  abnormal: "bg-danger-tint text-danger-strong",
  unknown: "bg-muted text-muted-foreground",
  no_reference: "bg-muted text-muted-foreground",
};

export function MeasurementsSection({
  measurements,
  title,
  primary,
  studyId,
}: MeasurementsSectionProps) {
  if (measurements.length === 0) return null;

  return (
    <section aria-labelledby="measurements-section-heading">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3
          id="measurements-section-heading"
          className={`text-[13px] font-semibold uppercase tracking-wide ${
            primary ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {title ?? "Valores de tu estudio"}
        </h3>
        <span className="text-[12px] text-muted-foreground">
          {measurements.length} valor{measurements.length !== 1 ? "es" : ""}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {measurements.map((m, index) => {
          const significance = getMeasurementSignificance(m.significance, m.status);
          const statusLabel = getStatusLabel(m.status);
          const hasStatus = m.status !== undefined && m.status !== "unknown" && m.status !== "no_reference";
          const style = m.status ? STATUS_STYLES[m.status] : "";

          return (
            <article
              key={m.name || index}
              className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface p-4"
            >
              <h4 className="text-[13px] font-medium text-foreground">
                {m.name}
              </h4>

              {significance && (
                <p className="text-body font-medium text-foreground leading-snug">
                  {significance}
                </p>
              )}

              {m.value && (
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-[15px] font-medium tabular-nums text-foreground">
                    {m.value}
                  </span>
                  {m.unit && (
                    <span className="text-[12px] text-muted-foreground">
                      {m.unit}
                    </span>
                  )}
                  {hasStatus && statusLabel && (
                    <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${style}`}>
                      {statusLabel}
                    </span>
                  )}
                </div>
              )}

              {m.reference_range && (
                <p className="text-[11px] text-muted-foreground">
                  Rango indicado: {m.reference_range}
                </p>
              )}

              <StudyChatCta
                studyId={studyId}
                label="Preguntar sobre este valor"
                prompt={buildStudyChatPrompt({
                  kind: "measurement",
                  measurement: m,
                })}
                compact
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}
