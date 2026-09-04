import { getStudy, getStudyExtraction, getStudyAnalysis } from "@/lib/actions/studies";
import type { StudyAnalysis } from "@/lib/analysis/schema";
import { parseStoredAnalysis } from "@/lib/analysis/stored";
import { formatFileSize, getProcessingErrorLabel, getStudyTypeLabelNullable } from "@/lib/studies-utils";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { StudyDeleteButton } from "@/components/dashboard/StudyDeleteButton";
import { StudyDownloadButton } from "@/components/dashboard/StudyDownloadButton";
import { StudyProcessButton } from "@/components/dashboard/StudyProcessButton";
import { StudyStatusBadge } from "@/components/dashboard/StudyStatusBadge";
import { AnalyzeStudyButton } from "@/components/studies/AnalyzeStudyButton";
import { AnalysisResult } from "@/components/studies/AnalysisResult";
import { StudyExtraction } from "@/components/studies/StudyExtraction";
import { StudyPipelineController } from "@/components/studies/StudyPipelineController";
import { getAnalysisErrorMessage } from "@/lib/analysis/errors";

/**
 * Límite de ejecución en Vercel (Hobby: máx 60 s, Pro: máx 300 s).
 * Debe ser estrictamente mayor que ANALYSIS_TIMEOUT_MS (45 s) en gemini.ts
 * para que AbortController pueda actuar antes de que la plataforma corte la función.
 */
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
      // Se muestra el fallback sin romper la página.
    }
  }

  // Obtener análisis IA almacenado (sin volver a llamar a Gemini).
  let analysis: StudyAnalysis | null = null;
  if (study.status === "processed") {
    try {
      const row = await getStudyAnalysis(id);
      if (row?.analysis) {
        analysis = parseStoredAnalysis(row.analysis);
      }
    } catch {
      // La tabla puede no existir aún o haber un error transitorio.
      // Se muestra la página sin análisis sin romper.
    }
  }

  // ── Contenido de la columna principal ─────────────────────────

  // La sidebar muestra "Procesar" para uploaded, processing y error.
  const showSidebarProcessButton =
    study.status === "uploaded" ||
    study.status === "processing" ||
    study.status === "error";

  // Determinar si hay un análisis válido renderizable.
  const hasRenderableAnalysis = analysis !== null;

  // Determinar si debemos mostrar el pipeline controller (procesando/análisis pendiente).
  const showPipeline =
    study.status === "processed" &&
    !hasRenderableAnalysis &&
    study.analysis_status !== "failed" &&
    study.analysis_status !== "completed";

  // Determinar si hay un error de análisis sin análisis renderizable.
  const showAnalysisError =
    study.status === "processed" &&
    !hasRenderableAnalysis &&
    study.analysis_status === "failed";

  // Análisis "completado" pero no renderizable: el dato almacenado está
  // corrupto o incompleto (parseStoredAnalysis devolvió null). Evita la
  // pantalla en blanco ofreciendo volver a analizar.
  const showCorruptAnalysis =
    study.status === "processed" &&
    !hasRenderableAnalysis &&
    study.analysis_status === "completed";

  // Determinar si hay un error de procesamiento retryable (sin análisis renderizable).
  const showProcessingError =
    (study.status === "error" || study.status === "uploaded" || study.status === "ocr_required") &&
    !hasRenderableAnalysis;

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
        {/* ── Columna principal (ancho) ─────────────────────── */}
        <div className="min-w-0 space-y-6">
          {/* ── Estado: uploaded / ocr_required ─────────────── */}
          {(study.status === "uploaded" || study.status === "ocr_required") && (
            <div className="rounded-xl border border-ocean/20 bg-ocean-tint p-4 text-[14px] leading-[1.6] text-ocean-dark">
              <p>
                {study.status === "ocr_required"
                  ? "Este documento requiere procesamiento adicional para extraer su contenido."
                  : "El documento está pendiente de procesamiento. Iniciá el procesamiento para extraer su contenido."}
              </p>
              <div className="mt-3">
                <StudyProcessButton studyId={study.id} />
              </div>
            </div>
          )}

          {/* ── Estado: processing ─────────────────────────── */}
          {study.status === "processing" && (
            <div className="rounded-xl border border-ocean/20 bg-ocean-tint p-4 text-[14px] leading-[1.6] text-ocean-dark">
              Se está procesando el documento. Esta operación suele tardar unos
              segundos.
            </div>
          )}

          {/* ── Análisis válido: siempre se muestra ────────── */}
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

          {/* ── Análisis fallido (sin análisis renderizable) ── */}
          {showAnalysisError && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-danger" />
                <h2 className="text-[15px] font-medium text-foreground">
                  Análisis de IA
                </h2>
              </div>
              <p className="text-[14px] leading-[1.6] text-danger-strong">
                {getAnalysisErrorMessage(study.analysis_error ?? "gemini_failed")}
              </p>
              <div className="mt-4">
                <AnalyzeStudyButton studyId={study.id} hasAnalysis={false} />
              </div>
            </div>
          )}

          {/* ── Análisis corrupto/incompleto (completado pero no renderizable) ── */}
          {showCorruptAnalysis && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-warning" />
                <h2 className="text-[15px] font-medium text-foreground">
                  Análisis de IA
                </h2>
              </div>
              <p className="text-[14px] leading-[1.6] text-foreground/80">
                El análisis almacenado de este estudio no se pudo leer. Podés
                volver a generarlo.
              </p>
              <div className="mt-4">
                <AnalyzeStudyButton studyId={study.id} hasAnalysis={false} />
              </div>
            </div>
          )}

          {/* ── Pipeline automático (procesando o analizando) ── */}
          {showPipeline && (
            <StudyPipelineController
              studyId={study.id}
              status={study.status}
              analysisStatus={study.analysis_status ?? "pending"}
              hasAnalysis={false}
            />
          )}

          {/* ── Error de procesamiento (sin análisis renderizable) ── */}
          {showProcessingError && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-danger" />
                <h2 className="text-[15px] font-medium text-foreground">
                  Procesamiento del documento
                </h2>
              </div>
              <p className="text-[14px] leading-[1.6] text-danger-strong">
                {getProcessingErrorLabel(study.processing_error)}
              </p>
              <div className="mt-4">
                <StudyProcessButton studyId={study.id} />
              </div>
            </div>
          )}

          {/* ── Extracción no disponible ───────────────────── */}
          {study.status === "processed" && !extraction && (
            <div className="rounded-xl border border-ocean/20 bg-ocean-tint p-4 text-[14px] leading-[1.6] text-ocean-dark">
              El documento fue procesado, pero todavía no tenemos disponible
              el contenido extraído.
            </div>
          )}
        </div>

        {/* ── Columna secundaria (300px) ────────────────────── */}
        <aside className="space-y-6">
          {/* Metadata */}
          <section
            aria-label="Metadatos del estudio"
            className="rounded-xl border border-border bg-surface p-5"
          >
            <dl className="space-y-4">
              <div>
                <dt className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                  Tipo
                </dt>
                <dd className="mt-1 text-[14px] font-medium text-foreground">
                  {getStudyTypeLabelNullable(study.study_type)}
                </dd>
              </div>

              <div>
                <dt className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                  Fecha de subida
                </dt>
                <dd className="mt-1 text-[14px] text-foreground">
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
                <dt className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                  Tamaño
                </dt>
                <dd className="mt-1 text-[14px] text-foreground">
                  {formatFileSize(study.file_size)}
                </dd>
              </div>

              <div>
                <dt className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                  Tipo de archivo
                </dt>
                <dd className="mt-1 font-mono text-[13px] text-foreground">
                  {study.mime_type}
                </dd>
              </div>

              <div>
                <dt className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                  Estado
                </dt>
                <dd className="mt-1 text-[14px] text-foreground">
                  <StudyStatusBadge
                    status={study.status}
                    analysisStatus={study.analysis_status}
                  />
                </dd>
              </div>
            </dl>
          </section>

          {/* Acciones */}
          <section
            aria-label="Acciones"
            className="flex flex-col gap-3"
          >
            <StudyDownloadButton studyId={study.id} />
            {showSidebarProcessButton && <StudyProcessButton studyId={study.id} />}
            <StudyDeleteButton studyId={study.id} studyName={study.file_name} />
          </section>

          {/* Contenido extraído (colapsado) */}
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