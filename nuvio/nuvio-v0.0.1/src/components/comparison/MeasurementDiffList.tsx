import type { MeasurementDiff } from "@/lib/comparison/types";
import type { Measurement } from "@/lib/analysis/schema";
import {
  changeKind,
  CHANGE_LABELS,
  CHANGE_BADGE_TONES,
  CHANGE_ICONS,
  formatValueWithUnit,
  formatReferenceRange,
  formatSignedDelta,
  formatPercentageChange,
  numericComparisonNote,
  UNIT_MISMATCH_NOTE,
  MEASUREMENT_STATUS_LABELS,
  MEASUREMENT_STATUS_TONES,
} from "@/lib/comparison/presentation";

// ── Comparación: mediciones ─────────────────────────────────────────────

/** Tarjeta de una medición nueva o ausente. */
function NewMissingMeasurementCard({
  kind,
  measurement,
}: {
  kind: "new" | "missing";
  measurement: Measurement;
}) {
  const isNew = kind === "new";
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="min-w-0 text-[14px] font-medium leading-snug text-foreground">
          {measurement.name}
        </h4>
        <span
          className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
            isNew ? "bg-ocean-tint text-ocean" : "bg-muted text-muted-foreground"
          }`}
        >
          {isNew ? "Nuevo" : "Ausente"}
        </span>
      </div>
      <p className="font-mono text-[17px] font-medium leading-none tracking-tight text-foreground">
        {formatValueWithUnit(measurement.value, measurement.unit)}
      </p>
      {measurement.status !== undefined && (
        <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-medium ${MEASUREMENT_STATUS_TONES[measurement.status]}`}>
          {MEASUREMENT_STATUS_LABELS[measurement.status]}
        </span>
      )}
      {measurement.reference_range && (
        <p className="text-[12px] text-muted-foreground">
          Ref. {measurement.reference_range}
        </p>
      )}
      <p className="mt-1 text-[12px] text-muted-foreground">
        {isNew
          ? "Solo aparece en el estudio posterior."
          : "Solo aparece en el estudio anterior."}
      </p>
    </article>
  );
}

/**
 * Tarjeta de una medición comparable (presente en ambos estudios).
 * Jerarquía de la información (Fase 9.6):
 * - Nombre + badge de cambio
 * - Anterior → Posterior (los valores se muestran una sola vez)
 * - Resumen del cambio: "Aumentó · +15 mg/dL · +15,8%" / "Sin cambios"
 * - Estado y rango de referencia subordinados (solo cuando aportan contexto)
 */
function ComparableMeasurementCard({
  diff,
}: {
  diff: Extract<MeasurementDiff, { status: "comparable" }>;
}) {
  const kind = changeKind(diff);
  const note = numericComparisonNote(diff);
  const delta = formatSignedDelta(diff);
  const pct = formatPercentageChange(diff);
  const unit = diff.unitMismatch.currentUnit ?? diff.unitMismatch.previousUnit ?? "";
  const statusChanged =
    diff.statusDiff.changed &&
    diff.statusDiff.previousStatus !== undefined &&
    diff.statusDiff.currentStatus !== undefined;
  const currentStatus = diff.statusDiff.currentStatus;
  const currentRange = formatReferenceRange(diff.referenceRangeDiff.currentRange);
  const isChanged = kind === "increased" || kind === "decreased";

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="min-w-0 text-[14px] font-medium leading-snug text-foreground">
          {diff.name}
        </h4>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${CHANGE_BADGE_TONES[kind]}`}
        >
          <span aria-hidden="true">{CHANGE_ICONS[kind]}</span>
          {CHANGE_LABELS[kind]}
        </span>
      </div>

      {/* Anterior → Posterior (una sola lectura de valores) */}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Anterior
        </span>
        <span className="font-mono text-[17px] font-medium leading-none tracking-tight text-foreground">
          {formatValueWithUnit(diff.previousValue, diff.unitMismatch.previousUnit)}
        </span>
        <span className="text-muted-foreground" aria-hidden="true">→</span>
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Posterior
        </span>
        <span className="font-mono text-[17px] font-medium leading-none tracking-tight text-foreground">
          {formatValueWithUnit(diff.currentValue, diff.unitMismatch.currentUnit)}
        </span>
      </div>

      {/* Resumen del cambio */}
      {isChanged && delta !== null ? (
        <p className="text-[14px] font-semibold text-foreground">
          {CHANGE_LABELS[kind]}
          <span className="tabular-nums">
            {" · "}{delta}{unit ? ` ${unit}` : ""}{pct !== null ? ` · ${pct}` : ""}
          </span>
        </p>
      ) : kind === "stable" ? (
        <p className="text-[13px] text-muted-foreground">Sin cambios</p>
      ) : kind === "incompatible" ? (
        <p className="text-[12px] leading-[1.6] text-muted-foreground">
          {UNIT_MISMATCH_NOTE}
        </p>
      ) : (
        note && (
          <p className="text-[12px] leading-[1.6] text-muted-foreground">
            {note}
          </p>
        )
      )}

      {/* Estado y rango: subordinados, solo cuando aportan contexto */}
      {isChanged &&
        (statusChanged ||
          diff.referenceRangeDiff.changed ||
          currentStatus !== undefined ||
          currentRange) && (
          <div className="border-t border-border pt-2.5 text-[12px] leading-[1.6] text-muted-foreground">
            {statusChanged ? (
              <p>
                <span className="font-medium text-foreground">Estado:</span>{" "}
                {MEASUREMENT_STATUS_LABELS[diff.statusDiff.previousStatus!]} →{" "}
                {MEASUREMENT_STATUS_LABELS[diff.statusDiff.currentStatus!]}
              </p>
            ) : currentStatus !== undefined ? (
              <p>
                <span className="font-medium text-foreground">Estado:</span>{" "}
                {MEASUREMENT_STATUS_LABELS[currentStatus]}
              </p>
            ) : null}
            {diff.referenceRangeDiff.changed ? (
              <p className={statusChanged ? "mt-1" : ""}>
                <span className="font-medium text-foreground">Rango de referencia:</span>{" "}
                {formatReferenceRange(diff.referenceRangeDiff.previousRange) ?? "no informado"}
                {" → "}
                {formatReferenceRange(diff.referenceRangeDiff.currentRange) ?? "no informado"}
              </p>
            ) : currentRange ? (
              <p className={currentStatus !== undefined || statusChanged ? "mt-1" : ""}>
                <span className="font-medium text-foreground">Ref.:</span> {currentRange}
              </p>
            ) : null}
          </div>
        )}
    </article>
  );
}

/**
 * Lista de mediciones de la comparación.
 * Cada diff se muestra como tarjeta (responsive, sin tablas):
 * - comparable: Anterior/Posterior + cambio + delta/% + rango + estado
 * - new / missing: valor con badge "Nuevo" / "Ausente"
 *
 * En Fase 9.4 el detalle por medición vive en esta lista; no se oculta
 * ningún estado (no comparable por unidades, valores no numéricos, etc.).
 */
export function MeasurementDiffList({
  diffs,
}: {
  diffs: MeasurementDiff[];
}) {
  if (diffs.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground">
        No hay mediciones para comparar entre ambos estudios.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {diffs.map((diff, index) =>
        diff.status === "comparable" ? (
          <ComparableMeasurementCard
            key={`cmp-${diff.name}-${index}`}
            diff={diff}
          />
        ) : (
          <NewMissingMeasurementCard
            key={`${diff.status}-${diff.name}-${index}`}
            kind={diff.status}
            measurement={diff.measurement}
          />
        )
      )}
    </div>
  );
}

