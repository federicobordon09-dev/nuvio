import type { MeasurementDiff } from "@/lib/comparison/types";
import type { Measurement, MeasurementStatus } from "@/lib/analysis/schema";
import {
  changeKind,
  CHANGE_LABELS,
  CHANGE_BADGE_TONES,
  CHANGE_ICONS,
  formatValueWithUnit,
  formatReferenceRange,
  formatDelta,
  formatPercentageChange,
  numericComparisonNote,
  MEASUREMENT_STATUS_LABELS,
  MEASUREMENT_STATUS_TONES,
} from "@/lib/comparison/presentation";

// ── Comparación: mediciones ─────────────────────────────────────────────

/** Columna Anterior/Posterior de una medición comparable. */
function MeasurementColumn({
  label,
  value,
  unit,
  referenceRange,
  status,
}: {
  label: "Anterior" | "Posterior";
  value: string;
  unit: string | null | undefined;
  referenceRange: string | null | undefined;
  status?: MeasurementStatus;
}) {
  const range = formatReferenceRange(referenceRange);
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-[17px] font-medium leading-none tracking-tight text-foreground">
        {formatValueWithUnit(value, unit)}
      </p>
      {status !== undefined && (
        <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${MEASUREMENT_STATUS_TONES[status]}`}>
          {MEASUREMENT_STATUS_LABELS[status]}
        </span>
      )}
      {range && <p className="mt-1.5 text-[12px] text-muted-foreground">Ref. {range}</p>}
    </div>
  );
}

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

/** Tarjeta de una medición comparable (presente en ambos estudios). */
function ComparableMeasurementCard({
  diff,
}: {
  diff: Extract<MeasurementDiff, { status: "comparable" }>;
}) {
  const kind = changeKind(diff);
  const note = numericComparisonNote(diff);
  const delta = formatDelta(diff);
  const pct = formatPercentageChange(diff);
  const statusChanged =
    diff.statusDiff.changed &&
    diff.statusDiff.previousStatus !== undefined &&
    diff.statusDiff.currentStatus !== undefined;

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

      <div className="grid grid-cols-2 gap-3">
        <MeasurementColumn
          label="Anterior"
          value={diff.previousValue}
          unit={diff.unitMismatch.previousUnit}
          referenceRange={diff.referenceRangeDiff.previousRange}
          status={diff.statusDiff.previousStatus}
        />
        <MeasurementColumn
          label="Posterior"
          value={diff.currentValue}
          unit={diff.unitMismatch.currentUnit}
          referenceRange={diff.referenceRangeDiff.currentRange}
          status={diff.statusDiff.currentStatus}
        />
      </div>

      {/* Fila de detalle del cambio */}
      <div className="border-t border-border pt-2.5">
        {delta !== null && (
          <p className="text-[12px] leading-[1.6] text-muted-foreground">
            <span className="font-medium text-foreground">Cambio:</span>{" "}
            {formatValueWithUnit(diff.previousValue, diff.unitMismatch.previousUnit)}
            {" → "}
            {formatValueWithUnit(diff.currentValue, diff.unitMismatch.currentUnit)}
            {pct !== null && (
              <span className="tabular-nums"> ·{" "}{pct}</span>
            )}
          </p>
        )}
        {delta === null && note && (
          <p className="text-[12px] leading-[1.6] text-muted-foreground">{note}</p>
        )}
        {delta === null && !note && (
          <p className="text-[12px] leading-[1.6] text-muted-foreground">
            {formatValueWithUnit(diff.previousValue, diff.unitMismatch.previousUnit)}
            {" → "}
            {formatValueWithUnit(diff.currentValue, diff.unitMismatch.currentUnit)}
          </p>
        )}
        {statusChanged && (
          <p className="mt-1 text-[12px] leading-[1.6] text-muted-foreground">
            <span className="font-medium text-foreground">Estado:</span>{" "}
            {MEASUREMENT_STATUS_LABELS[diff.statusDiff.previousStatus!]} →{" "}
            {MEASUREMENT_STATUS_LABELS[diff.statusDiff.currentStatus!]}
          </p>
        )}
        {diff.referenceRangeDiff.changed && (
          <p className="mt-1 text-[12px] leading-[1.6] text-muted-foreground">
            <span className="font-medium text-foreground">Rango de referencia:</span>{" "}
            {formatReferenceRange(diff.referenceRangeDiff.previousRange) ?? "no informado"}
            {" → "}
            {formatReferenceRange(diff.referenceRangeDiff.currentRange) ?? "no informado"}
          </p>
        )}
      </div>
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

