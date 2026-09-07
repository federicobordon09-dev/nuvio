import Link from "next/link";
import { parseCompareIds } from "@/lib/comparison/url";
import { compareStudies } from "@/lib/comparison/compare-studies";
import type {
  StudyForComparison,
} from "@/lib/comparison/types";
import type { StudyAnalysis } from "@/lib/analysis/schema";
import { parseStoredAnalysis } from "@/lib/analysis/stored";
import { getStudy, getStudyAnalysis } from "@/lib/actions/studies";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ComparisonContext } from "@/components/comparison/ComparisonContext";
import { ComparisonSummary } from "@/components/comparison/ComparisonSummary";
import { MeasurementDiffList } from "@/components/comparison/MeasurementDiffList";
import { KeyFindingsList } from "@/components/comparison/KeyFindingsList";
import { ComparisonDisclaimer } from "@/components/comparison/ComparisonDisclaimer";
import type { ComparisonStudy } from "@/lib/comparison/presentation";

/**
 * Fase 9.4 — Página de comparación de estudios.
 *
 * Funciona mediante parámetros de URL: `/dashboard/comparar?ids=ID_A,ID_B`
 *
 * - Carga ambos estudios con verificación de ownership server-side (getStudy).
 * - Carga y parsea ambos análisis almacenados (getStudyAnalysis + parseStoredAnalysis).
 * - Ejecuta el motor determinístico de Fase 9.2 (compareStudies).
 * - La presentación delega en componentes bajo src/components/comparison/,
 *   que reciben los datos ya calculados (sin lógica de comparación duplicada).
 */

// ── Tipos de la fila de estudio (solo los campos que necesita la página) ──

type StudyRow = ComparisonStudy & {
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

// ── Página ────────────────────────────────────────────────────────────

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

  // ── Estados: IDs inválidos ───────────────────────────────
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

  // ── Carga de análisis almacenados ───────────────────────
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

  // ── Ejecutar el motor de comparación (Fase 9.2) ─────────
  const studyForA: StudyForComparison = {
    analysis: analysisA,
    analysisStatus: toAnalysisStatus(studyA.analysis_status),
  };
  const studyForB: StudyForComparison = {
    analysis: analysisB,
    analysisStatus: toAnalysisStatus(studyB.analysis_status),
  };
  const result = compareStudies(studyForA, studyForB);

  // Contexto de ambos estudios para todas las vistas post-carga.
  const context = (
    <ComparisonContext studyA={studyA} studyB={studyB} />
  );

  // ── Estado: no comparables ──────────────────────────────
  if (!result.comparable) {
    const detail = result.incompatibility.detail;
    return (
      <div>
        {header}
        <div className="space-y-6">
          {context}
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

  // ── Estado: comparables sin diferencias ─────────────────
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
          {context}
          <EmptyState
            icon={<CheckCircleIcon />}
            title="Sin diferencias detectadas"
            description="Las mediciones y hallazgos de ambos estudios coinciden."
          />
        </div>
      </div>
    );
  }

  // ── Estado: comparables con diferencias ─────────────────
  // Explicaciones reales: las toma del análisis posterior (B) porque es el
  // que describe el hallazgo tal como está presente en la comparación.
  const explanations = new Map<string, string>();
  for (const finding of analysisB.key_findings) {
    explanations.set(finding.title, finding.explanation);
  }

  const nonNumericCount = result.overall.numericSummary.notComparableCount;

  return (
    <div>
      {header}
      <div className="space-y-6">
        {context}
        <ComparisonSummary result={result} />

        <section aria-labelledby="comparison-measurements-heading">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2
              id="comparison-measurements-heading"
              className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Mediciones
            </h2>
            <span className="text-[12px] text-muted-foreground">
              {result.measurementDiffs.length} mediciones*
            </span>
          </div>
          <MeasurementDiffList diffs={result.measurementDiffs} />
          {nonNumericCount > 0 && (
            <p className="mt-3 text-[12px] text-muted-foreground">
              * {nonNumericCount} valor
              {nonNumericCount !== 1 ? "es" : ""} sin comparación numérica
              (texto o unidades distintas).
            </p>
          )}
        </section>

        <KeyFindingsList
          diffs={result.keyFindingDiffs}
          explanations={explanations}
        />

        <ComparisonDisclaimer />
      </div>
    </div>
  );
}