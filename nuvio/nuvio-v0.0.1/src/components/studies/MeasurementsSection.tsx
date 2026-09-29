"use client";

import type { Measurement, MeasurementStatus } from "@/lib/analysis/schema";
import {
  getMeasurementSignificance,
  getStatusLabel,
} from "@/lib/analysis/measurement-significance";
import { StudyChatCta } from "@/components/chat/StudyChatCta";
import { buildStudyChatPrompt } from "@/lib/chat/study-chat-cta";
import { BiomarkerScale } from "./BiomarkerScale";
import { SectionAccordion } from "./SectionAccordion";

interface MeasurementsSectionProps {
  measurements: Measurement[];
  title?: string;
  primary?: boolean;
  studyId: string;
}

const STATUS_STYLES: Record<MeasurementStatus, string> = {
  within_range: "bg-success-tint text-success-strong",
  above_range: "bg-warning-tint text-warning-strong",
  below_range: "bg-info-tint text-info",
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
    <SectionAccordion
      title={title ?? "Valores de tu estudio"}
      countLabel={`${measurements.length} valor${measurements.length !== 1 ? "es" : ""}`}
      primary={primary}
    >
      <div className="flex flex-col gap-3">
        {measurements.map((m, index) => {
          const significance = getMeasurementSignificance(
            m.significance,
            m.status
          );
          const statusLabel = getStatusLabel(m.status);
          const hasStatus =
            m.status !== undefined &&
            m.status !== "unknown" &&
            m.status !== "no_reference";
          const style = m.status ? STATUS_STYLES[m.status] : "";
          const hasValue = Boolean(m.value);

          return (
            <article
              key={m.name || index}
              className="flex flex-col gap-2 rounded-xl border border-border bg-background p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="flex min-w-0 flex-col items-start gap-2">
                  <h4 className="text-body font-semibold text-primary">
                    {m.name}
                  </h4>
                  {hasStatus && statusLabel && (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold leading-4 tracking-[0.04em] ${style}`}
                    >
                      {statusLabel}
                    </span>
                  )}
                </div>

                {hasValue && (
                  <div className="flex shrink-0 items-baseline gap-1.5">
                    <span className="data-value">{m.value}</span>
                    {m.unit && (
                      <span className="text-caption font-medium text-muted-foreground">
                        {m.unit}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {significance && (
                <p className="text-body leading-body text-foreground/85">
                  {significance}
                </p>
              )}

              {/* Escala de referencia: solo si hay rango + valor reales. */}
              {m.reference_range && m.value ? (
                <BiomarkerScale
                  name={m.name}
                  value={m.value}
                  unit={m.unit ?? null}
                  referenceRange={m.reference_range}
                />
              ) : (
                m.reference_range && (
                  <p className="text-caption text-muted-foreground">
                    Rango indicado:{" "}
                    <span className="font-medium tabular-nums text-foreground">
                      {m.reference_range}
                    </span>
                  </p>
                )
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
    </SectionAccordion>
  );
}
