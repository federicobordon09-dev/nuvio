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

/** Card de una medición presente en un solo estudio. */
function NewMissingMeasurementCard({
  kind,
  measurement,
}: {
  kind: "new" | "missing";
  measurement: Measurement;
}) {
  const isNew = kind === "new";
  return (
    <article className="flex flex-col gap-3 rounded-[20px] border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="min-w-0 text-body font-semibold leading-snug text-primary">
          {measurement.name}
        </h3>
        <span
          className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-caption font-medium ${
            isNew ? "bg-primary-muted text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          {isNew ? "Nuevo" : "Ausente"}
        </span>
      </div>
      <p className="data-value-sm">
        {formatValueWithUnit(measurement.value, measurement.unit)}
      </p>
      {measurement.status !== undefined && (
        <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-medium ${MEASUREMENT_STATUS_TONES[measurement.status]}`}>
          {MEASUREMENT_STATUS_LABELS[measurement.status]}
        </span>
      )}
      {measurement.reference_range && (
        <p className="text-caption tabular-nums text-muted-foreground">
          Ref. {measurement.reference_range}
        </p>
      )}
      <p className="mt-auto text-caption text-muted-foreground">
        {isNew
          ? "Solo aparece en el estudio más reciente."
          : "Solo aparece en el estudio anterior."}
      </p>
    </article>
  );
}

/** Frase corta con la magnitud del cambio (delta y % salen del payload). */
function HumanReadableChange({
  kind,
  diff,
}: {
  kind: ReturnType<typeof changeKind>;
  diff: Extract<MeasurementDiff, { status: "comparable" }>;
}) {
  const isChanged = kind === "increased" || kind === "decreased";
  const delta = formatSignedDelta(diff);
  const pct = formatPercentageChange(diff);
  const unit = diff.unitMismatch.currentUnit ?? diff.unitMismatch.previousUnit ?? "";

  if (kind === "stable") {
    return (
      <p className="text-body font-medium text-foreground">
        Se mantuvo similar entre ambos estudios.
      </p>
    );
  }

  if (kind === "incompatible") {
    return (
      <p className="text-body text-muted-foreground">
        {UNIT_MISMATCH_NOTE}
      </p>
    );
  }

  if (kind === "non_numeric") {
    const note = numericComparisonNote(diff);
    return note ? (
      <p className="text-body text-muted-foreground">{note}</p>
    ) : null;
  }

  if (isChanged) {
    const direction = kind === "increased" ? "aumentó" : "disminuyó";
    return (
      <p className="text-body font-medium text-foreground">
        El valor {direction}
        {delta && (
          <span className="tabular-nums text-muted-foreground">
            {" "}({delta}{unit ? ` ${unit}` : ""}{pct ? `, ${pct}` : ""})
          </span>
        )}
      </p>
    );
  }

  return null;
}

/** Card de una medición presente en ambos estudios. */
function ComparableMeasurementCard({
  diff,
}: {
  diff: Extract<MeasurementDiff, { status: "comparable" }>;
}) {
  const kind = changeKind(diff);
  const statusChanged =
    diff.statusDiff.changed &&
    diff.statusDiff.previousStatus !== undefined &&
    diff.statusDiff.currentStatus !== undefined;
  const currentStatus = diff.statusDiff.currentStatus;
  const currentRange = formatReferenceRange(diff.referenceRangeDiff.currentRange);

  return (
    <article className="flex flex-col gap-3 rounded-[20px] border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="min-w-0 text-body font-semibold leading-snug text-primary">
          {diff.name}
        </h3>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-caption font-medium ${CHANGE_BADGE_TONES[kind]}`}
        >
          <span aria-hidden="true">{CHANGE_ICONS[kind]}</span>
          {CHANGE_LABELS[kind]}
        </span>
      </div>

      <HumanReadableChange kind={kind} diff={diff} />

      {/* Valores reales de cada estudio, en columnas etiquetadas. */}
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-background p-3">
        <div className="min-w-0">
          <span className="data-label">Anterior</span>
          <p className="mt-1 data-value-sm break-words">
            {formatValueWithUnit(diff.previousValue, diff.unitMismatch.previousUnit)}
          </p>
        </div>
        <div className="min-w-0 border-l border-border pl-3">
          <span className="data-label">Posterior</span>
          <p className="mt-1 data-value-sm break-words">
            {formatValueWithUnit(diff.currentValue, diff.unitMismatch.currentUnit)}
          </p>
        </div>
      </div>

      {(statusChanged || currentStatus !== undefined || currentRange) && (
        <div className="mt-auto border-t border-border pt-3 text-caption leading-body text-muted-foreground">
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
              <span className="font-medium text-foreground">Ref.:</span>{" "}
              <span className="tabular-nums">{currentRange}</span>
            </p>
          ) : null}
        </div>
      )}
    </article>
  );
}

export function MeasurementDiffList({
  diffs,
}: {
  diffs: MeasurementDiff[];
}) {
  if (diffs.length === 0) {
    return (
      <p className="text-caption text-muted-foreground">
        No hay mediciones para comparar entre ambos estudios.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
