import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listStudies } from "@/lib/actions/studies";
import { groupStudiesByType } from "@/lib/studies/history";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StudySelectionList } from "@/components/dashboard/StudySelection";
import { Button } from "@/components/ui/Button";
import { Document } from "@/components/ui/icons";

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
        <Link href="/dashboard/subir">
          <Button>Subir estudio</Button>
        </Link>
      </PageHeader>

      {studies.length === 0 ? (
        <EmptyState
          icon={<Document className="h-6 w-6" />}
          title="No tenés estudios cargados todavía"
          description="Subí tu primer estudio médico para que Nuvio lo analice y te explique los resultados de forma clara."
          action={
            <Link href="/dashboard/subir">
              <Button>Subir estudio</Button>
            </Link>
          }
        />
      ) : (
        <StudySelectionList
          groups={groupStudiesByType(
            studies.map((s) => ({
              id: s.id,
              file_name: s.file_name,
              study_type: s.study_type,
              status: s.status,
              analysis_status: s.analysis_status,
              file_size: s.file_size,
              created_at: s.created_at,
            })),
          )}
        />
      )}
    </div>
  );
}
