import type { ReactNode } from "react";
import Link from "next/link";
import { parseCompareIds } from "@/lib/comparison/url";
import { compareStudies } from "@/lib/comparison/compare-studies";
import type {
  ComparisonResult,
  KeyFindingDiff,
  MeasurementComparable,
  MeasurementDiff,
  StudyForComparison,
} from "@/lib/comparison/types";
import type { StudyAnalysis } from "@/lib/analysis/schema";
import { parseStoredAnalysis } from "@/lib/analysis/stored";
import { getStudy, getStudyAnalysis } from "@/lib/actions/studies";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  getStudyTypeLabelNullable,
  formatFileSize,
  type StudyType,
} from "@/lib/studies-utils";

/**
 * Fase 9.3 — Página de comparación de estudios.
 *
 * Funciona mediante parámetros de URL: `/dashboard/comparar?ids=ID_A,ID_B`
 *
 * - Carga ambos estudios con verificación de ownership server-side (getStudy).
 * - Carga y parsea ambos análisis almacenados (getStudyAnalysis + parseStoredAnalysis).
 * - Ejecuta el motor determinístico de Fase 9.2 (compareStudies).
 * - Muestra resultados básicos; la presentación detallada es de Fase 9.4.
 */

// ── Tipos de la fila de estudio (solo los campos que necesita la página) ──

type StudyRow = {
  id: string;
  file_name: string;
  file_size: number;
  study_type: string | null;
  analysis_status: string | null;
};

/**
 * Normaliza `analysis_status` (que puede ser null) al tipo `AnalysisStatus`
 * requerido por el motor de comparación.
 */
function toAnalysisStatus(status: string | null): StudyForComparison["analysisStatus"] {
  switch (status) {
    case "completed":
      return "completed";
    case "processing":
      return "processing";
    case "failed":
      return "failed";
    default:
      return "pending";
  }
}

// ── Íconos inline (mismo estilo que el resto del dashboard) ───────────────

function WarningIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}

function SearchXIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM13.5 10.5l-3 3m0-3 3 3" />
    </svg>
  );
}

function DocumentSlashIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function SplitIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
    </svg>
  );
}

// ── Helpers de formato ─────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return Number.isInteger(n) ? n.toString() : n.toFixed(2);
}

function measurementValue(diff: MeasurementComparable): string {
  const { previousValue, currentValue, unitMismatch } = diff;
  const fmt = (v: string, u: string | null | undefined) =>
    v.length > 0 ? `${v}${u ? ` ${u}` : ""}` : "—";
  return `${fmt(previousValue, unitMismatch.previousUnit)} → ${fmt(currentValue, unitMismatch.currentUnit)}`;
}

function measurementChangeLabel(diff: MeasurementComparable): string {
  const vd = diff.valueDiff;
  if (vd.kind === "both_numeric") {
    if (vd.direction === "increased") return `Subió ${formatNumber(vd.absoluteDifference)}`;
    if (vd.direction === "decreased") return `Bajó ${formatNumber(vd.absoluteDifference)}`;
    return "Sin cambios";
  }
  if (vd.kind === "not_comparable") return "No comparable";
  return "Sin comparación numérica";
}

function measurementChangeTone(diff: MeasurementComparable): string {
  const vd = diff.valueDiff;
  if (vd.kind === "both_numeric") {
    if (vd.direction === "increased") return "text-danger";
    if (vd.direction === "decreased") return "text-success";
    return "text-muted-foreground";
  }
  return "text-muted-foreground";
}

function measurementChangeIcon(diff: MeasurementComparable): ReactNode {
  const vd = diff.valueDiff;
  if (vd.kind === "both_numeric") {
    if (vd.direction === "increased") return <ArrowUpIcon />;
    if (vd.direction === "decreased") return <ArrowDownIcon />;
  }
  return <MinusIcon />;
}

const IMPORTANCE_LABELS: Record<string, string> = {
  normal: "Normal",
  high: "Alto",
  low: "Bajo",
  abnormal: "Anormal",
  unknown: "Desconocido",
};

function importanceLabel(importance?: string | null): string {
  return importance ? IMPORTANCE_LABELS[importance] ?? importance : "Sin especificar";
}

function valueDiffSummaryLabel(diff: MeasurementComparable): string {
  const vd = diff.valueDiff;
  if (vd.kind !== "both_numeric") return "—";
  const parts = [measurementChangeLabel(diff)];
  if (vd.percentageChange !== null) {
    const pct = `${vd.percentageChange > 0 ? "+" : ""}${formatNumber(vd.percentageChange)}%`;
    parts.push(pct);
  }
  return parts.join(" · ");
}

// ── Componentes de listado ─────────────────────────────────────────────────

function MeasurementDiffList({ diffs }: { diffs: MeasurementDiff[] }) {
  if (diffs.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground">Sin mediciones para mostrar.</p>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {diffs.map((diff) => {
        if (diff.status === "new") {
          return (
            <li key={`new-${diff.name}`} className="flex items-center justify-between gap-3 py-2.5">
              <span className="min-w-0 truncate text-[14px] font-medium text-foreground">{diff.name}</span>
              <span className="shrink-0 rounded-full bg-ocean-tint px-2.5 py-0.5 text-[12px] font-medium text-ocean">
                Nuevo
              </span>
            </li>
          );
        }
        if (diff.status === "missing") {
          return (
            <li key={`missing-${diff.name}`} className="flex items-center justify-between gap-3 py-2.5">
              <span className="min-w-0 truncate text-[14px] font-medium text-foreground">{diff.name}</span>
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-[12px] font-medium text-muted-foreground">
                Ausente
              </span>
            </li>
          );
        }
        return (
          <li key={`cmp-${diff.name}`} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-[14px] font-medium text-foreground">{diff.name}</span>
                <span className={`inline-flex shrink-0 items-center gap-1 text-[13px] font-medium ${measurementChangeTone(diff)}`}>
                  {measurementChangeIcon(diff)}
                  {measurementChangeLabel(diff)}
                </span>
              </div>
              <p className="mt-0.5 font-mono text-[12px] text-muted-foreground">
                {measurementValue(diff)}
              </p>
            </div>
            <span className="shrink-0 text-[12px] text-muted-foreground">
              {valueDiffSummaryLabel(diff)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function KeyFindingDiffList({ diffs }: { diffs: KeyFindingDiff[] }) {
  if (diffs.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground">Sin hallazgos para mostrar.</p>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {diffs.map((diff) => {
        if (diff.status === "new") {
          return (
            <li key={`new-${diff.title}`} className="flex items-center justify-between gap-3 py-2.5">
              <span className="min-w-0 truncate text-[14px] font-medium text-foreground">{diff.title}</span>
              <span className="shrink-0 rounded-full bg-ocean-tint px-2.5 py-0.5 text-[12px] font-medium text-ocean">
                Nuevo
              </span>
            </li>
          );
        }
        if (diff.status === "missing") {
          return (
            <li key={`missing-${diff.title}`} className="flex items-center justify-between gap-3 py-2.5">
              <span className="min-w-0 truncate text-[14px] font-medium text-foreground">{diff.title}</span>
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-[12px] font-medium text-muted-foreground">
                Ausente
              </span>
            </li>
          );
        }
        return (
          <li key={`cmp-${diff.title}`} className="flex items-center justify-between gap-3 py-2.5">
            <span className="min-w-0 truncate text-[14px] font-medium text-foreground">{diff.title}</span>
            {diff.importanceChanged ? (
              <span className="shrink-0 text-[12px] text-warning">
                Importancia: {importanceLabel(diff.previousImportance)} → {importanceLabel(diff.currentImportance)}
              </span>
            ) : (
              <span className="shrink-0 text-[12px] text-muted-foreground">Sin cambios</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// ── Resultados ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-3 text-[14px] font-medium text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function OverallCard({ result }: { result: Extract<ComparisonResult, { comparable: true }> }) {
  const { overall } = result;
  const items = [
    { label: "Mediciones comparadas", value: overall.numericSummary.comparableCount },
    { label: "Subieron", value: overall.numericSummary.increasedCount },
    { label: "Bajaron", value: overall.numericSummary.decreasedCount },
    { label: "Estables", value: overall.numericSummary.stableCount },
    { label: "Sin comparación numérica", value: overall.numericSummary.notComparableCount },
    { label: "Parámetros nuevos", value: overall.newParametersCount },
    { label: "Parámetros ausentes", value: overall.missingParametersCount },
    { label: "Hallazgos nuevos", value: overall.newFindingsCount },
    { label: "Hallazgos ausentes", value: overall.missingFindingsCount },
  ];
  return (
    <SectionCard title="Resumen de la comparación">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              {item.label}
            </dt>
            <dd className="mt-1 text-[20px] font-medium leading-none text-foreground">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </SectionCard>
  );
}

function StudiesContextRow({ studyA, studyB }: { studyA: StudyRow; studyB: StudyRow }) {
  const renderStudy = (study: StudyRow) => (
    <Link
      href={`/dashboard/estudios/${study.id}`}
      className="group rounded-xl border border-border bg-surface p-4 transition-colors hover:border-ocean/40"
    >
      <p className="truncate text-[14px] font-medium text-foreground group-hover:text-ocean">
        {study.file_name}
      </p>
      <dl className="mt-2 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-[12px] text-muted-foreground">Tipo</dt>
          <dd className="text-[12px] font-medium text-foreground">
            {getStudyTypeLabelNullable(study.study_type as StudyType | null)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-[12px] text-muted-foreground">Tamaño</dt>
          <dd className="text-[12px] font-medium text-foreground">
            {formatFileSize(study.file_size)}
          </dd>
        </div>
      </dl>
    </Link>
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <span className="sr-only">Estudio A</span>
      {renderStudy(studyA)}
      <span className="sr-only">Estudio B</span>
      {renderStudy(studyB)}
    </div>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────

export default async function CompararPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const parsed = parseCompareIds(ids);

  const header = (
    <>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Mis estudios", href: "/dashboard/estudios" },
          { label: "Comparar" },
        ]}
      />
      <PageHeader
        title="Comparar estudios"
        description="Compará mediciones y hallazgos entre dos de tus estudios."
      />
    </>
  );

  // ── Estados: IDs inválidos ─────────────────────────────────
  if (!parsed.ok) {
    return (
      <div>
        {header}
        <EmptyState
          icon={<WarningIcon />}
          title="Comparación no disponible"
          description={parsed.message}
          action={
            <Link
              href="/dashboard/estudios"
              className="rounded-lg bg-ocean px-4 py-2 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
            >
              Ir a mis estudios
            </Link>
          }
        />
      </div>
    );
  }

  // ── Carga de estudios (ownership verificado server-side) ──
  let studyA: StudyRow;
  try {
    studyA = await getStudy(parsed.ids[0]);
  } catch {
    return (
      <div>
        {header}
        <EmptyState
          icon={<SearchXIcon />}
          title="Estudio no encontrado"
          description="No pudimos encontrar el primer estudio o no tenés acceso a él. Verificá el ID en la URL."
          action={
            <Link
              href="/dashboard/estudios"
              className="rounded-lg bg-ocean px-4 py-2 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
            >
              Ir a mis estudios
            </Link>
          }
        />
      </div>
    );
  }

  let studyB: StudyRow;
  try {
    studyB = await getStudy(parsed.ids[1]);
  } catch {
    return (
      <div>
        {header}
        <EmptyState
          icon={<SearchXIcon />}
          title="Estudio no encontrado"
          description="No pudimos encontrar el segundo estudio o no tenés acceso a él. Verificá el ID en la URL."
          action={
            <Link
              href="/dashboard/estudios"
              className="rounded-lg bg-ocean px-4 py-2 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
            >
              Ir a mis estudios
            </Link>
          }
        />
      </div>
    );
  }

  // ── Carga de análisis almacenados ─────────────────────────
  let analysisA: StudyAnalysis | null = null;
  try {
    const rowA = await getStudyAnalysis(studyA.id);
    analysisA = rowA?.analysis ? parseStoredAnalysis(rowA.analysis) : null;
  } catch {
    analysisA = null;
  }

  let analysisB: StudyAnalysis | null = null;
  try {
    const rowB = await getStudyAnalysis(studyB.id);
    analysisB = rowB?.analysis ? parseStoredAnalysis(rowB.analysis) : null;
  } catch {
    analysisB = null;
  }

  if (!analysisA || !analysisB) {
    const which = !analysisA ? "primer" : "segundo";
    return (
      <div>
        {header}
        <EmptyState
          icon={<DocumentSlashIcon />}
          title="Análisis no disponible"
          description={`El ${which} estudio todavía no tiene un análisis completo que podamos leer. Procesá y analizá ambos estudios antes de compararlos.`}
          action={
            <Link
              href="/dashboard/estudios"
              className="rounded-lg bg-ocean px-4 py-2 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
            >
              Ir a mis estudios
            </Link>
          }
        />
      </div>
    );
  }

  // ── Ejecutar el motor de comparación (Fase 9.2) ───────────
  const studyForA: StudyForComparison = {
    analysis: analysisA,
    analysisStatus: toAnalysisStatus(studyA.analysis_status),
  };
  const studyForB: StudyForComparison = {
    analysis: analysisB,
    analysisStatus: toAnalysisStatus(studyB.analysis_status),
  };
  const result = compareStudies(studyForA, studyForB);

  // ── Estado: no comparables ────────────────────────────────
  if (!result.comparable) {
    const detail = result.incompatibility.detail;
    return (
      <div>
        {header}
        <div className="space-y-6">
          <StudiesContextRow studyA={studyA} studyB={studyB} />
          <div className="rounded-xl border border-warning/30 bg-warning-tint p-5">
            <div className="mb-2 flex items-center gap-2">
              <SplitIcon />
              <h2 className="text-[15px] font-medium text-foreground">
                Los estudios no son comparables
              </h2>
            </div>
            <p className="text-[14px] leading-[1.6] text-foreground/80">{detail}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Estado: comparables ───────────────────────────────────
  const hasChanges =
    result.overall.newParametersCount > 0 ||
    result.overall.missingParametersCount > 0 ||
    result.overall.newFindingsCount > 0 ||
    result.overall.missingFindingsCount > 0 ||
    result.overall.numericSummary.increasedCount > 0 ||
    result.overall.numericSummary.decreasedCount > 0 ||
    result.overall.numericSummary.notComparableCount > 0;

  if (!hasChanges) {
    return (
      <div>
        {header}
        <div className="space-y-6">
          <StudiesContextRow studyA={studyA} studyB={studyB} />
          <EmptyState
            icon={<CheckCircleIcon />}
            title="Sin diferencias detectadas"
            description="Las mediciones y hallazgos de ambos estudios coinciden."
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {header}
      <div className="space-y-6">
        <StudiesContextRow studyA={studyA} studyB={studyB} />
        <OverallCard result={result} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="Mediciones">
            <MeasurementDiffList diffs={result.measurementDiffs} />
          </SectionCard>
          <SectionCard title="Hallazgos clínicos">
            <KeyFindingDiffList diffs={result.keyFindingDiffs} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}