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
        <h4 className="min-w-0 text-body font-medium leading-snug text-foreground">
          {measurement.name}
        </h4>
        <span
          className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-caption font-medium ${
            isNew ? "bg-primary-muted text-primary" : "bg-muted text-muted-foreground"
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
        <p className="text-caption text-muted-foreground">
          Ref. {measurement.reference_range}
        </p>
      )}
      <p className="mt-1 text-caption text-muted-foreground">
        {isNew
          ? "Solo aparece en el estudio posterior."
          : "Solo aparece en el estudio anterior."}
      </p>
    </article>
  );
}

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
        <h4 className="min-w-0 text-body font-medium leading-snug text-foreground">
          {diff.name}
        </h4>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-caption font-medium ${CHANGE_BADGE_TONES[kind]}`}
        >
          <span aria-hidden="true">{CHANGE_ICONS[kind]}</span>
          {CHANGE_LABELS[kind]}
        </span>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="data-label">
          Anterior
        </span>
        <span className="font-mono text-[17px] font-medium leading-none tracking-tight text-foreground">
          {formatValueWithUnit(diff.previousValue, diff.unitMismatch.previousUnit)}
        </span>
        <span className="text-muted-foreground" aria-hidden="true">→</span>
        <span className="data-label">
          Posterior
        </span>
        <span className="font-mono text-[17px] font-medium leading-none tracking-tight text-foreground">
          {formatValueWithUnit(diff.currentValue, diff.unitMismatch.currentUnit)}
        </span>
      </div>

      {isChanged && delta !== null ? (
        <p className="text-body font-semibold text-foreground">
          {CHANGE_LABELS[kind]}
          <span className="tabular-nums">
            {" · "}{delta}{unit ? ` ${unit}` : ""}{pct !== null ? ` · ${pct}` : ""}
          </span>
        </p>
      ) : kind === "stable" ? (
        <p className="text-caption text-muted-foreground">Sin cambios</p>
      ) : kind === "incompatible" ? (
        <p className="text-caption leading-body text-muted-foreground">
          {UNIT_MISMATCH_NOTE}
        </p>
      ) : (
        note && (
          <p className="text-caption leading-body text-muted-foreground">
            {note}
          </p>
        )
      )}

      {isChanged &&
        (statusChanged ||
          diff.referenceRangeDiff.changed ||
          currentStatus !== undefined ||
          currentRange) && (
          <div className="border-t border-border pt-2.5 text-caption leading-body text-muted-foreground">
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
