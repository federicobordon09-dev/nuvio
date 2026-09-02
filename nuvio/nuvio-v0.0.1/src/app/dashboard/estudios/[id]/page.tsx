import { getStudy, getStudyExtraction, getStudyAnalysis } from "@/lib/actions/studies";
import type { StudyAnalysis } from "@/lib/analysis/schema";
import { parseStoredAnalysis } from "@/lib/analysis/stored";
import { formatFileSize, getProcessingErrorLabel, getStudyTypeLabel } from "@/lib/studies-utils";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { StudyDeleteButton } from "@/components/dashboard/StudyDeleteButton";
import { StudyDownloadButton } from "@/components/dashboard/StudyDownloadButton";
import { StudyProcessButton } from "@/components/dashboard/StudyProcessButton";
import { StudyStatusBadge } from "@/components/dashboard/StudyStatusBadge";
import { AnalyzeStudyButton } from "@/components/studies/AnalyzeStudyButton";
import { AnalysisResult } from "@/components/studies/AnalysisResult";
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

      <div className="rounded-xl border border-ink-700/10 bg-white p-6 shadow-[0_1px_2px_rgba(11,20,38,0.04)]">
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              Tipo
            </dt>
            <dd className="mt-1 text-[15px] text-foreground">
              {getStudyTypeLabel(study.study_type)}
            </dd>
          </div>

          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              Fecha de subida
            </dt>
            <dd className="mt-1 text-[15px] text-foreground">
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
            <dd className="mt-1 text-[15px] text-foreground">
              {formatFileSize(study.file_size)}
            </dd>
          </div>

          <div>
            <dt className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              Tipo de archivo
            </dt>
            <dd className="mt-1 text-[15px] text-foreground">
              {study.mime_type}
            </dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
              Estado
            </dt>
            <dd className="mt-1 text-[15px] text-foreground">
              <StudyStatusBadge
                status={study.status}
                analysisStatus={study.analysis_status}
              />
            </dd>
          </div>
        </dl>
      </div>

      {study.status === "uploaded" && (
        <div className="mt-6 rounded-xl border border-cyan-400/40 bg-cyan-50 p-4 text-[14px] leading-[1.6] text-cyan-900">
          El documento está pendiente de procesamiento. Iniciá el procesamiento
          para extraer su contenido.
        </div>
      )}
      {study.status === "processing" && (
        <div className="mt-6 rounded-xl border border-yellow-400/40 bg-yellow-50 p-4 text-[14px] leading-[1.6] text-yellow-900">
          Se está procesando el documento. Esta operación suele tardar unos
          segundos.
        </div>
      )}
      {study.status === "processed" && (
        <div className="mt-6">
          {analysis ? (
            <>
              <AnalysisResult analysis={analysis} />
              <div className="mt-4">
                <AnalyzeStudyButton studyId={study.id} hasAnalysis />
              </div>
            </>
          ) : study.analysis_status === "failed" ? (
            <div className="rounded-xl border border-ink-700/10 bg-white p-6 shadow-[0_1px_2px_rgba(11,20,38,0.04)]">
              <h2 className="text-[15px] font-medium text-foreground">
                Análisis de IA
              </h2>
              <p className="mt-2 text-[14px] leading-[1.6] text-red-600">
                {getAnalysisErrorMessage(study.analysis_error ?? "gemini_failed")}
              </p>
              <div className="mt-4">
                <AnalyzeStudyButton studyId={study.id} hasAnalysis={false} />
              </div>
            </div>
          ) : (
            <StudyPipelineController
              studyId={study.id}
              status={study.status}
              analysisStatus={study.analysis_status ?? "pending"}
              hasAnalysis={false}
            />
          )}
        </div>
      )}
      {study.status === "processed" && extraction && (
        <div className="mt-6 rounded-xl border border-ink-700/10 bg-white shadow-[0_1px_2px_rgba(11,20,38,0.04)]">
          <div className="border-b border-ink-700/10 px-6 py-4">
            <h2 className="text-[15px] font-medium text-foreground">
              Contenido extraído
            </h2>
            {extraction.page_count != null && (
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Extraído del documento original · {extraction.page_count} página{extraction.page_count !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <div className="max-h-[600px] overflow-y-auto px-6 py-4">
            <pre className="whitespace-pre-wrap break-words font-sans text-[14px] leading-[1.6] text-foreground">
              {extraction.extracted_text}
            </pre>
          </div>
        </div>
      )}
      {study.status === "processed" && !extraction && (
        <div className="mt-6 rounded-xl border border-green-400/40 bg-green-50 p-4 text-[14px] leading-[1.6] text-green-900">
          El documento fue procesado correctamente, pero el contenido extraído
          todavía no está disponible.
        </div>
      )}
      {study.status === "error" && (
        <div className="mt-6 rounded-xl border border-red-400/40 bg-red-50 p-4 text-[14px] leading-[1.6] text-red-900">
          {getProcessingErrorLabel(study.processing_error)}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {(study.status === "uploaded" ||
          study.status === "processing" ||
          study.status === "error") && <StudyProcessButton studyId={study.id} />}
        <StudyDownloadButton studyId={study.id} />
        <StudyDeleteButton studyId={study.id} studyName={study.file_name} />
      </div>
    </div>
  );
}