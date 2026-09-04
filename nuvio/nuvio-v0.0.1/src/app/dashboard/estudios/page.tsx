import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listStudies } from "@/lib/actions/studies";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StudyCard } from "@/components/dashboard/StudyCard";
import { EmptyState } from "@/components/dashboard/EmptyState";

export const dynamic = "force-dynamic";

export default async function EstudiosPage() {
  // Auth ANTES del try/catch y con un único client — shared con la data fetch.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/auth/login");
  }

  let studies: NonNullable<Awaited<ReturnType<typeof listStudies>>>;
  try {
    studies = await listStudies({ supabase, userId: user!.id });
  } catch (err) {
    console.error("[nuvio:estudios] Error cargando estudios:", err);
    studies = [];
  }

  return (
    <div>
      <PageHeader title="Mis estudios" description="Todos tus estudios médicos en un solo lugar.">
        <Link
          href="/dashboard/subir"
          className="inline-flex rounded-lg bg-primary-600 px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primary-700"
        >
          Subir estudio
        </Link>
      </PageHeader>

      {studies.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          }
          title="No tenés estudios cargados todavía"
          description="Subí tu primer estudio médico para que Nuvio lo analice y te explique los resultados de forma clara."
          action={
            <Link
              href="/dashboard/subir"
              className="inline-flex rounded-lg bg-primary-600 px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primary-700"
            >
              Subir estudio
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {studies.map((study) => (
            <StudyCard key={study.id} study={study} />
          ))}
        </div>
      )}
    </div>
  );
}
