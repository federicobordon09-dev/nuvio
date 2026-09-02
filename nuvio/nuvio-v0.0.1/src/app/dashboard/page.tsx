import Link from "next/link";
import { getStudyCount } from "@/lib/actions/studies";

export default async function DashboardPage() {
  let studyCount = 0;
  try {
    studyCount = await getStudyCount();
  } catch {
    studyCount = 0;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[24px] font-medium tracking-[-0.02em] text-foreground">
          Inicio
        </h1>
        <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">
          Bienvenido a Nuvio. Subí un estudio para comenzar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/dashboard/subir"
          className="group rounded-xl border border-ink-700/10 bg-white p-5 shadow-[0_1px_2px_rgba(11,20,38,0.04)] transition-all duration-200 hover:shadow-[0_2px_8px_rgba(11,20,38,0.06)] hover:border-ink-700/15"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          </div>
          <h3 className="text-[15px] font-medium text-foreground group-hover:text-primary-600 transition-colors">
            Subir estudio
          </h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Subí un documento médico para analizar.
          </p>
        </Link>

        <Link
          href="/dashboard/estudios"
          className="group rounded-xl border border-ink-700/10 bg-white p-5 shadow-[0_1px_2px_rgba(11,20,38,0.04)] transition-all duration-200 hover:shadow-[0_2px_8px_rgba(11,20,38,0.06)] hover:border-ink-700/15"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/[0.06] text-cyan-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <h3 className="text-[15px] font-medium text-foreground group-hover:text-primary-600 transition-colors">
            Mis estudios
          </h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Revisá tus estudios anteriores.
          </p>
          <p className="mt-3 text-[13px] font-medium text-foreground">
            {studyCount} {studyCount === 1 ? "estudio" : "estudios"}
          </p>
        </Link>

        <Link
          href="/dashboard/chat"
          className="group rounded-xl border border-ink-700/10 bg-white p-5 shadow-[0_1px_2px_rgba(11,20,38,0.04)] transition-all duration-200 hover:shadow-[0_2px_8px_rgba(11,20,38,0.06)] hover:border-ink-700/15"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
          </div>
          <h3 className="text-[15px] font-medium text-foreground group-hover:text-primary-600 transition-colors">
            Chat IA
          </h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Hacé preguntas sobre tus estudios.
          </p>
        </Link>
      </div>
    </div>
  );
}
