import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerClient, getServerUser } from "@/lib/supabase/server";
import { listStudies } from "@/lib/actions/studies";
import { groupStudiesByType } from "@/lib/studies/history";
import { computeStudyStats, type StudyStats } from "@/lib/studies-utils";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StudySelectionList } from "@/components/dashboard/StudySelection";
import { Button } from "@/components/ui/Button";
import { Document, Upload } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

/**
 * Barra de resumen del listado — solo lectura, sin controles.
 * Todos los conteos salen de `computeStudyStats` sobre las filas reales
 * ya cargadas por la página: no hay números escritos a mano.
 * Los pares de color son los de DESIGN.md (sage / lilac / neutral / coral).
 */
function StudySummaryBar({ stats }: { stats: StudyStats }) {
  const chips = [
    {
      key: "ready",
      count: stats.ready,
      one: "listo",
      many: "listos",
      dot: "bg-success",
      className: "bg-success-tint text-success-strong",
    },
    {
      key: "in_progress",
      count: stats.in_progress,
      one: "en proceso",
      many: "en proceso",
      dot: "bg-primary",
      className: "bg-primary-muted text-primary",
    },
    {
      key: "pending",
      count: stats.pending,
      one: "pendiente",
      many: "pendientes",
      dot: "bg-muted-foreground/60",
      className: "bg-muted text-muted-foreground",
    },
    {
      key: "errors",
      count: stats.errors,
      one: "con error",
      many: "con error",
      dot: "bg-danger",
      className: "bg-danger-tint text-danger-strong",
    },
  ].filter((chip) => chip.count > 0);

  return (
    <section
      aria-label="Resumen de tus estudios"
      className="mb-6 flex flex-col gap-3 rounded-[20px] border border-border bg-surface px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="data-label">Estado de tus estudios</span>
      <ul className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <li
            key={chip.key}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption font-medium ${chip.className}`}
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${chip.dot}`}
            />
            {plural(chip.count, chip.one, chip.many)} ({chip.count})
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function EstudiosPage() {
  const supabase = await getServerClient();
  const user = await getServerUser();
  if (!user) {
    redirect("/auth/login");
  }

  let studies: NonNullable<Awaited<ReturnType<typeof listStudies>>>;
  try {
    studies = await listStudies({ supabase, userId: user.id });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[nuvio:estudios] Error cargando estudios:", err);
    }
    studies = [];
  }

  const stats = computeStudyStats(studies);

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Mis estudios" },
        ]}
      />

      <PageHeader
        title="Mis estudios"
        description="Tu biblioteca personal de información médica."
      >
        <div className="flex flex-wrap items-center gap-3">
          {stats.total > 0 && (
            <span className="inline-flex items-center rounded-full bg-primary-muted px-3 py-1 text-caption font-semibold text-primary tabular-nums">
              {stats.total} {plural(stats.total, "guardado", "guardados")}
            </span>
          )}
          <Link href="/dashboard/subir">
            <Button>
              <Upload aria-hidden="true" className="h-4 w-4" />
              Subir estudio
            </Button>
          </Link>
        </div>
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
        <>
          <StudySummaryBar stats={stats} />
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
        </>
      )}
    </div>
  );
}
