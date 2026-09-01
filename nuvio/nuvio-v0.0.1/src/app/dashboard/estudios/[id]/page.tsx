import { getStudy } from "@/lib/actions/studies";
import { formatFileSize, getStudyTypeLabel } from "@/lib/studies-utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StudyDeleteButton } from "@/components/dashboard/StudyDeleteButton";
import { StudyDownloadButton } from "@/components/dashboard/StudyDownloadButton";

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

  return (
    <div>
      <Link
        href="/dashboard/estudios"
        className="mb-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Volver a mis estudios
      </Link>

      <div className="mb-8">
        <h1 className="text-[24px] font-medium tracking-[-0.02em] text-foreground">
          {study.file_name}
        </h1>
        <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">
          Información detallada del estudio seleccionado.
        </p>
      </div>

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
              {study.status === "uploaded" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-2.5 py-0.5 text-[13px] font-medium text-cyan-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                  Subido
                </span>
              )}
              {study.status === "processing" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-2.5 py-0.5 text-[13px] font-medium text-yellow-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
                  Procesando
                </span>
              )}
              {study.status === "processed" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-[13px] font-medium text-green-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Procesado
                </span>
              )}
              {study.status === "error" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-[13px] font-medium text-red-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Error
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <StudyDownloadButton studyId={study.id} />
        <StudyDeleteButton studyId={study.id} />
      </div>
    </div>
  );
}