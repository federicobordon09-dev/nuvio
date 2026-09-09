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
import { Button } from "@/components/ui/Button";
import { Warning, SearchX, DocumentSlash, Split, CheckCircle } from "@/components/ui/icons";
import {
  getIncompatibilityMessage,
  getStudyTypeLabelNullable,
  type ComparisonStudy,
} from "@/lib/comparison/presentation";
import type { StudyType } from "@/lib/studies-utils";

type StudyRow = ComparisonStudy & {
  analysis_status: string | null;
};

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

  if (!parsed.ok) {
    return (
      <div>
        {header}
        <EmptyState
          icon={<Warning className="h-6 w-6" />}
          title="Comparación no disponible"
          description={parsed.message}
          action={
            <Link href="/dashboard/estudios">
              <Button>Ir a mis estudios</Button>
            </Link>
          }
        />
      </div>
    );
  }

  let studyA: StudyRow;
  try {
    studyA = await getStudy(parsed.ids[0]);
  } catch {
    return (
      <div>
        {header}
        <EmptyState
          icon={<SearchX className="h-6 w-6" />}
          title="Estudio no encontrado"
          description="No pudimos encontrar el primer estudio o no tenés acceso a él. Verificá el ID en la URL."
          action={
            <Link href="/dashboard/estudios">
              <Button>Ir a mis estudios</Button>
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
          icon={<SearchX className="h-6 w-6" />}
          title="Estudio no encontrado"
          description="No pudimos encontrar el segundo estudio o no tenés acceso a él. Verificá el ID en la URL."
          action={
            <Link href="/dashboard/estudios">
              <Button>Ir a mis estudios</Button>
            </Link>
          }
        />
      </div>
    );
  }

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
          icon={<DocumentSlash className="h-6 w-6" />}
          title="Análisis no disponible"
          description={`El ${which} estudio todavía no tiene un análisis completo que podamos leer. Procesá y analizá ambos estudios antes de compararlos.`}
          action={
            <Link href="/dashboard/estudios">
              <Button>Ir a mis estudios</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const studyForA: StudyForComparison = {
    analysis: analysisA,
    analysisStatus: toAnalysisStatus(studyA.analysis_status),
  };
  const studyForB: StudyForComparison = {
    analysis: analysisB,
    analysisStatus: toAnalysisStatus(studyB.analysis_status),
  };
  const result = compareStudies(studyForA, studyForB);

  const context = (
    <ComparisonContext studyA={studyA} studyB={studyB} />
  );

  if (!result.comparable) {
    const { kind } = result.incompatibility;
    const message = getIncompatibilityMessage(kind);
    const typeContext =
      kind === "different_study_type"
        ? ` (${getStudyTypeLabelNullable(studyA.study_type as StudyType | null)} vs. ${getStudyTypeLabelNullable(studyB.study_type as StudyType | null)})`
        : "";
    return (
      <div>
        {header}
        <div className="space-y-6">
          {context}
          <div className="rounded-xl border border-warning/20 bg-warning-tint/50 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Split className="h-5 w-5 text-warning" />
              <h2 className="text-body font-medium text-foreground">
                No podemos comparar estos estudios
              </h2>
            </div>
            <p className="text-body text-muted-foreground">
              {message}
              {typeContext}
            </p>
            <div className="mt-4">
              <Link href="/dashboard/estudios">
                <Button>Volver a mis estudios</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            icon={<CheckCircle className="h-6 w-6" />}
            title="Sin diferencias detectadas"
            description="Las mediciones y hallazgos de ambos estudios coinciden."
          />
        </div>
      </div>
    );
  }

  const explanations = new Map<string, string>();
  for (const finding of analysisB.key_findings) {
    explanations.set(finding.title, finding.explanation);
  }

  const nonNumericCount = result.overall.numericSummary.notComparableCount;

  return (
    <div>
      {header}
      <div className="space-y-8">
        {context}
        <ComparisonSummary result={result} />

        <section aria-labelledby="comparison-measurements-heading">
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <h2
              id="comparison-measurements-heading"
              className="data-label"
            >
              Mediciones
            </h2>
            <span className="text-caption text-muted-foreground">
              {result.measurementDiffs.length} mediciones*
            </span>
          </div>
          <MeasurementDiffList diffs={result.measurementDiffs} />
          {nonNumericCount > 0 && (
            <p className="mt-3 text-caption text-muted-foreground">
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
