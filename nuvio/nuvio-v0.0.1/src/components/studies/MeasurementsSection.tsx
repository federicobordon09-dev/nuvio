"use client";

import type { Measurement, MeasurementStatus } from "@/lib/analysis/schema";

interface MeasurementsSectionProps {
  measurements: Measurement[];
  /** Label contextual (por tipo de estudio) — por defecto "Valores de tu estudio". */
  title?: string;
  /** Marca la sección como primaria (jerarquía visual superior). */
  primary?: boolean;
}

const MEASUREMENT_STATUS_LABELS: Record<MeasurementStatus, string> = {
  within_range: "Dentro del rango",
  above_range: "Por encima del rango",
  below_range: "Por debajo del rango",
  abnormal: "Anormal",
  unknown: "Sin determinar",
  no_reference: "Sin referencia",
};

const STATUS_STYLES: Record<MeasurementStatus, string> = {
  within_range: "bg-success-tint text-success-strong",
  above_range: "bg-warning-tint text-warning-strong",
  below_range: "bg-warning-tint text-warning-strong",
  abnormal: "bg-danger-tint text-danger-strong",
  unknown: "bg-muted text-muted-foreground",
  no_reference: "bg-muted text-muted-foreground",
};

/**
 * Sección de mediciones/valores médicos.
 * Muestra cada medición como tarjeta con valor, unidad, rango y estado.
 */
export function MeasurementsSection({
  measurements,
  title,
  primary,
}: MeasurementsSectionProps) {
  if (measurements.length === 0) return null;

  return (
    <section aria-labelledby="measurements-section-heading">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3
          id="measurements-section-heading"
          className={`text-[13px] font-semibold uppercase tracking-wide ${
            primary ? "text-primary-600" : "text-muted-foreground"
          }`}
        >
          {title ?? "Valores de tu estudio"}
        </h3>
        <span className="text-[12px] text-muted-foreground">
          {measurements.length} medición{measurements.length !== 1 ? "es" : ""}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {measurements.map((m, index) => {
          const style = m.status ? STATUS_STYLES[m.status] : "";
          const hasStatus = m.status !== undefined && m.status !== "unknown" && m.status !== "no_reference";

          return (
            <article
              key={m.name || index}
              className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="min-w-0 text-[14px] font-medium leading-snug text-foreground">
                  {m.name}
                </h4>
                {hasStatus && m.status && (
                  <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${style}`}>
                    {MEASUREMENT_STATUS_LABELS[m.status] ?? m.status}
                  </span>
                )}
              </div>

              {m.value && (
                <p className="font-mono text-[20px] font-medium leading-none tracking-tight text-foreground">
                  {m.value}
                  {m.unit && (
                    <span className="ml-1.5 font-sans text-[12px] font-normal text-muted-foreground">
                      {m.unit}
                    </span>
                  )}
                </p>
              )}

              {m.reference_range && (
                <p className="text-[12px] text-muted-foreground">
                  Ref. {m.reference_range}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
