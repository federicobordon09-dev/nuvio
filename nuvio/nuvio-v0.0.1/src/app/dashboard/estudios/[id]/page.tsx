import { getStudy, getStudyExtraction, getStudyAnalysis } from "@/lib/actions/studies";
import type { StudyAnalysis } from "@/lib/analysis/schema";
import { parseStoredAnalysis } from "@/lib/analysis/stored";
import { formatFileSize, getStudyTypeLabelNullable } from "@/lib/studies-utils";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { StudyDeleteButton } from "@/components/dashboard/StudyDeleteButton";
import { StudyDownloadButton } from "@/components/dashboard/StudyDownloadButton";
import { StudyStatusBadge } from "@/components/dashboard/StudyStatusBadge";
import { AnalyzeStudyButton } from "@/components/studies/AnalyzeStudyButton";
import { AnalysisResult } from "@/components/studies/AnalysisResult";
import { StudyExtraction } from "@/components/studies/StudyExtraction";
import { StudyPipelineController } from "@/components/studies/StudyPipelineController";
import { getAnalysisErrorMessage } from "@/lib/analysis/errors";
import { ErrorTriangle } from "@/components/ui/icons";

export const maxDuration = 60;

export default async function EstudioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let study;
  try {
    study = await getStudy(id);
  } catch {
    notFound();
  }

  let extraction: { extracted_text: string; page_count: number | null; method: string } | null = null;
  if (study.status === "processed") {
    try {
      extraction = await getStudyExtraction(id);
    } catch {
      // La tabla puede no existir aún o haber un error transitorio.
    }
  }

  let analysis: StudyAnalysis | null = null;
  if (study.status === "processed") {
    try {
      const row = await getStudyAnalysis(id);
      if (row?.analysis) {
        analysis = parseStoredAnalysis(row.analysis);
      }
    } catch {
      // La tabla puede no existir aún o haber un error transitorio.
    }
  }

  const hasRenderableAnalysis = analysis !== null;

  const showPipeline =
    (study.status === "uploaded" ||
      study.status === "processing" ||
      study.status === "ocr_required" ||
      study.status === "error" ||
      (study.status === "processed" &&
        !hasRenderableAnalysis &&
        study.analysis_status !== "failed" &&
        study.analysis_status !== "completed")) &&
    !hasRenderableAnalysis;

  const showAnalysisError =
    study.status === "processed" &&
    !hasRenderableAnalysis &&
    study.analysis_status === "failed";

  const showCorruptAnalysis =
    study.status === "processed" &&
    !hasRenderableAnalysis &&
    study.analysis_status === "completed";

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Mis estudios", href: "/dashboard/estudios" },
          { label: study.file_name },
        ]}
      />

      <PageHeader
        title={study.file_name}
        description="Información detallada del estudio seleccionado."
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px] lg:items-start">
        {/* ── Columna principal ──────────────────────── */}
        <div className="min-w-0 space-y-8">
          {hasRenderableAnalysis && analysis && (
            <>
              <AnalysisResult
                analysis={analysis}
                studyId={study.id}
                status={study.status}
                analysisStatus={study.analysis_status}
              />
              <div className="flex">
                <AnalyzeStudyButton studyId={study.id} hasAnalysis />
              </div>
            </>
          )}

          {showAnalysisError && (
            <div className="rounded-xl border border-danger/20 bg-danger-tint/50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <ErrorTriangle className="h-5 w-5 text-danger" />
                <h2 className="text-body font-medium text-foreground">
                  Análisis de IA
                </h2>
              </div>
              <p className="text-body text-danger-strong">
                {getAnalysisErrorMessage(study.analysis_error ?? "gemini_failed")}
              </p>
              <div className="mt-4">
                <AnalyzeStudyButton studyId={study.id} hasAnalysis={false} />
              </div>
            </div>
          )}

          {showCorruptAnalysis && (
            <div className="rounded-xl border border-warning/20 bg-warning-tint/50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="status-dot status-dot-warning" />
                <h2 className="text-body font-medium text-foreground">
                  Análisis de IA
                </h2>
              </div>
              <p className="text-body text-muted-foreground">
                El análisis almacenado de este estudio no se pudo leer. Podés
                volver a generarlo.
              </p>
              <div className="mt-4">
                <AnalyzeStudyButton studyId={study.id} hasAnalysis={false} />
              </div>
            </div>
          )}

          {showPipeline && (
            <StudyPipelineController
              studyId={study.id}
              status={study.status}
              analysisStatus={study.analysis_status ?? "pending"}
              hasAnalysis={false}
            />
          )}

          {study.status === "processed" && !extraction && (
            <div className="rounded-xl border border-primary/20 bg-primary-muted/50 p-4 text-body text-primary">
              El documento fue procesado, pero todavía no tenemos disponible
              el contenido extraído.
            </div>
          )}

        </div>

        {/* ── Columna secundaria (300px) ────────────────────── */}
        <aside className="space-y-6">
          <section
            aria-label="Metadatos del estudio"
            className="rounded-xl border border-border bg-surface p-5"
          >
            <dl className="space-y-4">
              <div>
                <dt className="data-label">
                  Tipo
                </dt>
                <dd className="mt-1 text-body font-medium text-foreground">
                  {getStudyTypeLabelNullable(study.study_type)}
                </dd>
              </div>

              <div>
                <dt className="data-label">
                  Fecha de subida
                </dt>
                <dd className="mt-1 text-body text-foreground">
                  {new Date(study.created_at).toLocaleDateString("es-AR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>

              <div>
                <dt className="data-label">
                  Tamaño
                </dt>
                <dd className="mt-1 text-body text-foreground">
                  {formatFileSize(study.file_size)}
                </dd>
              </div>

              <div>
                <dt className="data-label">
                  Tipo de archivo
                </dt>
                <dd className="mt-1 font-mono text-caption text-foreground">
                  {study.mime_type}
                </dd>
              </div>

              <div>
                <dt className="data-label">
                  Estado
                </dt>
                <dd className="mt-1 text-body text-foreground">
                  <StudyStatusBadge
                    status={study.status}
                    analysisStatus={study.analysis_status}
                  />
                </dd>
              </div>
            </dl>
          </section>

          <section
            aria-label="Acciones"
            className="flex flex-col gap-3"
          >
            <StudyDownloadButton studyId={study.id} />
            <StudyDeleteButton studyId={study.id} studyName={study.file_name} />
          </section>

          {study.status === "processed" && extraction && (
            <StudyExtraction
              text={extraction.extracted_text}
              pageCount={extraction.page_count}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
