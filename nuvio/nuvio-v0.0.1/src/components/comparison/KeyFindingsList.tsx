import type {
  KeyFindingDiff,
  KeyFindingComparable,
} from "@/lib/comparison/types";
import type { FindingStatus } from "@/lib/analysis/schema";
import {
  IMPORTANCE_TONES,
  importanceLabel,
} from "@/lib/comparison/presentation";

// ── Comparación: hallazgos ──────────────────────────────────────────────

/**
 * Muestra cómo cambian los hallazgos (findings) entre dos estudios:
 * - comparable: título + importancia de cada estudio (X → Y si cambió)
 * - new / missing: badge "Nuevo" / "Ausente" + importancia + explicación
 *
 * La explicación mostrada es la del estudio donde el hallazgo existe
 * (e.g. el estudio posterior para hallazgos nuevos). No se genera texto.
 */
export function KeyFindingsList({
  diffs,
  explanations,
}: {
  diffs: KeyFindingDiff[];
  /** title → explicación real del hallazgo en el estudio posterior (B). */
  explanations: Map<string, string>;
}) {
  if (diffs.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground">
        No hay hallazgos principales para comparar entre ambos estudios.
      </p>
    );
  }

  const explanationOf = (title: string): string | null =>
    explanations.get(title) ?? null;

  return (
    <section aria-labelledby="comparison-findings-heading">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2
          id="comparison-findings-heading"
          className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Hallazgos principales
        </h2>
        <span className="text-[12px] text-muted-foreground">
          {diffs.length} hallazgo{diffs.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {diffs.map((diff, index) => (
          <FindingDiffCard
            key={`${diff.status}-${diff.title}-${index}`}
            diff={diff}
            explanation={explanationOf(diff.title)}
          />
        ))}
      </div>
    </section>
  );
}

/** Importancia del hallazgo con tono y etiqueta de presentación. */
function ImportanceBadge({
  importance,
}: {
  importance: FindingStatus | undefined;
}) {
  return (
    <span
      className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
        importance ? IMPORTANCE_TONES[importance] : "bg-muted text-muted-foreground"
      }`}
    >
      {importanceLabel(importance)}
    </span>
  );
}

/** Banderas de estado del diff: "Nuevo" o "Ausente". */
function NewMissingBadge({ kind }: { kind: "new" | "missing" }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
        kind === "new"
          ? "bg-ocean-tint text-ocean"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {kind === "new" ? "Nuevo" : "Ausente"}
    </span>
  );
}

/** Tarjeta de un hallazgo comparable (presente en ambos estudios). */
function ComparableFindingCard({
  diff,
  explanation,
}: {
  diff: KeyFindingComparable;
  explanation: string | null;
}) {
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="min-w-0 text-[14px] font-medium leading-snug text-foreground">
          {diff.title}
        </h3>
        {diff.importanceChanged ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-medium bg-muted text-muted-foreground">
            <span className="tabular-nums">
              {importanceLabel(diff.previousImportance)}
            </span>
            <span aria-hidden="true">→</span>
            <span className="tabular-nums">
              {importanceLabel(diff.currentImportance)}
            </span>
          </span>
        ) : (
          <ImportanceBadge importance={diff.currentImportance} />
        )}
      </div>
      {explanation && (
        <p className="mt-auto pt-1 text-[13px] leading-[1.55] text-foreground/80 line-clamp-2">
          {explanation}
        </p>
      )}
    </article>
  );
}

/** Tarjeta de un hallazgo nuevo o ausente. */
function NewMissingFindingCard({
  diff,
  explanation,
}: {
  diff: Extract<KeyFindingDiff, { status: "new" | "missing" }>;
  explanation: string | null;
}) {
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="min-w-0 text-[14px] font-medium leading-snug text-foreground">
          {diff.title}
        </h3>
        <NewMissingBadge kind={diff.status} />
      </div>
      <ImportanceBadge importance={diff.finding.importance} />
      {explanation && (
        <p className="mt-auto pt-1 text-[13px] leading-[1.55] text-foreground/80 line-clamp-2">
          {explanation}
        </p>
      )}
    </article>
  );
}

/** Despacho del diff según su estado. */
function FindingDiffCard({
  diff,
  explanation,
}: {
  diff: KeyFindingDiff;
  explanation: string | null;
}) {
  switch (diff.status) {
    case "comparable":
      return <ComparableFindingCard diff={diff} explanation={explanation} />;
    default:
      return <NewMissingFindingCard diff={diff} explanation={explanation} />;
  }
}