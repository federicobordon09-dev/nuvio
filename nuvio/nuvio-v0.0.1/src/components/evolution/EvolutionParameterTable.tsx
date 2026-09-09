import {
  formatValueWithUnit,
  MEASUREMENT_STATUS_TONES,
  MEASUREMENT_STATUS_LABELS,
} from "@/lib/comparison/presentation";
import { SERIES_LETTERS } from "@/lib/evolution/selection";
import type { EvolutionContextStudy } from "@/lib/evolution/presentation";
import {
  formatShortDate,
  changeSymbol,
  changeLabel,
  changeTone,
  formatChangeDelta,
  formatChangePercent,
} from "@/lib/evolution/presentation";
import type {
  ParameterTrack,
  PointValue,
  ValueChange,
} from "@/lib/evolution/types";
import { ParameterSparkline } from "./ParameterSparkline";

function formatChangeDetail(change: ValueChange): string | null {
  if (change.kind !== "both_numeric") return null;
  const delta = formatChangeDelta(change);
  const pct = formatChangePercent(change);
  return delta === null
    ? null
    : pct !== null
      ? `${delta} (${pct})`
      : delta;
}

function ChangePill({ change }: { change: ValueChange }) {
  const detail = formatChangeDetail(change);
  return (
    <span
      aria-label={changeLabel(change)}
      title={changeLabel(change)}
      className={`inline-flex max-w-full items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${changeTone(change)}`}
    >
      <span aria-hidden="true">{changeSymbol(change)}</span>
      {detail && <span>{detail}</span>}
    </span>
  );
}

function PointCell({
  point,
  change,
}: {
  point: PointValue;
  change: ValueChange | null;
}) {
  const status = point.status;
  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      {change && <ChangePill change={change} />}
      <span className="text-caption font-medium tabular-nums text-foreground">
        {formatValueWithUnit(point.value, point.unit)}
      </span>
      {status && (
        <span
          className={`max-w-full truncate rounded-full px-1.5 py-0.5 text-[10px] font-medium ${MEASUREMENT_STATUS_TONES[status]}`}
        >
          {MEASUREMENT_STATUS_LABELS[status]}
        </span>
      )}
      {point.referenceRange && (
        <span className="max-w-full truncate text-[10px] text-muted-foreground">
          Ref {point.referenceRange}
        </span>
      )}
    </div>
  );
}

export function EvolutionParameterTable({
  parameters,
  studies,
}: {
  parameters: ParameterTrack[];
  studies: EvolutionContextStudy[];
}) {
  const columnIndex = new Map<string, number>(
    studies.map((s, i) => [s.id, i]),
  );
  const studyIds = studies.map((s) => s.id);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[48rem] border-collapse text-left">
        <caption className="sr-only">
          Evolución de parámetros a lo largo de la serie de estudios
        </caption>
        <thead>
          <tr className="border-b border-border">
            <th
              scope="col"
              className="sticky left-0 z-10 bg-surface px-4 py-3 data-label"
            >
              Parámetro
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-center data-label"
            >
              Tendencia
            </th>
            {studies.map((study, i) => (
              <th
                key={study.id}
                scope="col"
                className="min-w-[7rem] px-3 py-3 text-center"
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet text-[12px] font-semibold text-white"
                >
                  {SERIES_LETTERS[i]}
                </span>
                <span className="mt-1 block text-[11px] font-medium text-muted-foreground">
                  {formatShortDate(study.created_at)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {parameters.map((track) => (
            <EvolutionTrackRow
              key={track.name}
              track={track}
              columnIndex={columnIndex}
              studyCount={studies.length}
              studyIds={studyIds}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EvolutionTrackRow({
  track,
  columnIndex,
  studyCount,
  studyIds,
}: {
  track: ParameterTrack;
  columnIndex: Map<string, number>;
  studyCount: number;
  studyIds: string[];
}) {
  const cells: { point: PointValue; change: ValueChange | null }[] = Array(
    studyCount,
  ).fill(null);
  track.points.forEach((point, j) => {
    const col = columnIndex.get(point.studyId);
    if (col !== undefined) {
      cells[col] = {
        point,
        change: j === 0 ? null : (track.changes[j - 1] ?? null),
      };
    }
  });

  return (
    <tr className="border-b border-border align-top last:border-0">
      <th
        scope="row"
        className="sticky left-0 z-10 max-w-[12rem] bg-surface px-4 py-3 align-top"
      >
        <span className="block text-body font-medium text-foreground">
          {track.name}
        </span>
        {track.referenceRange && (
          <span className="mt-1 block text-[11px] text-muted-foreground">
            Ref {track.referenceRange}
          </span>
        )}
      </th>
      <td className="px-3 py-3 text-center">
        <ParameterSparkline track={track} studyIds={studyIds} />
      </td>
      {cells.map((cell, i) =>
        cell ? (
          <td key={i} className="px-3 py-3 text-center">
            <PointCell point={cell.point} change={cell.change} />
          </td>
        ) : (
          <td key={i} className="px-3 py-3 text-center">
            <span
              className="text-muted-foreground"
              aria-label="Sin valor en este estudio"
            >
              —
            </span>
          </td>
        ),
      )}
    </tr>
  );
}
