import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerClient, getServerUser } from "@/lib/supabase/server";
import { getStudyStats, listStudies } from "@/lib/actions/studies";
import { MAX_FILE_SIZE, type StudyStats } from "@/lib/studies-utils";
import { StudyCard } from "@/components/dashboard/StudyCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StudyStatsGrid } from "@/components/dashboard/StudyStatsGrid";
import { DashboardRail } from "@/components/dashboard/DashboardRail";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { Document, ChevronRight } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

const RECENT_LIMIT = 4;

const MAX_FILE_MB = MAX_FILE_SIZE / (1024 * 1024);

function plural(n: number, singular: string, many: string): string {
  return n === 1 ? singular : many;
}

function buildGreetingSummary(stats: StudyStats): string {
  if (stats.total === 0) {
    return "Todavía no tenés estudios cargados. Subí el primero y Nuvio te lo explica en palabras claras.";
  }

  const parts: string[] = [];
  if (stats.ready > 0) {
    parts.push(
      `${stats.ready} ${plural(stats.ready, "estudio listo", "estudios listos")}`,
    );
  }
  if (stats.in_progress > 0) {
    parts.push(
      `${stats.in_progress} ${plural(stats.in_progress, "estudio en proceso", "estudios en proceso")}`,
    );
  }
  if (stats.pending > 0) {
    parts.push(
      `${stats.pending} ${plural(stats.pending, "estudio pendiente", "estudios pendientes")}`,
    );
  }
  if (stats.errors > 0) {
    parts.push(
      `${stats.errors} ${plural(stats.errors, "estudio con error", "estudios con error")}`,
    );
  }

  const head = `Tenés ${stats.total} ${plural(stats.total, "estudio", "estudios")} en Nuvio`;
  if (parts.length === 0) return `${head}.`;

  const list =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`;
  return `${head}: ${list}.`;
}

export default async function DashboardPage() {
  const supabase = await getServerClient();
  const user = await getServerUser();
  if (!user) {
    redirect("/auth/login");
  }

  let stats: StudyStats = { total: 0, ready: 0, in_progress: 0, pending: 0, errors: 0 };
  let studies: Awaited<ReturnType<typeof listStudies>> = [];
  try {
    const opts = { supabase, userId: user.id };
    const [s, list] = await Promise.all([getStudyStats(opts), listStudies(opts)]);
    stats = s;
    studies = list;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[nuvio:dashboard] Error cargando datos:", err);
    }
  }

  const recent = studies.slice(0, RECENT_LIMIT);
  const userName = user?.user_metadata?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Usuario";

  return (
    <div>
      <DashboardGreeting
        userName={userName}
        greetingSummary={buildGreetingSummary(stats)}
        maxFileMB={MAX_FILE_MB}
      />

      {stats.total === 0 ? (
        <EmptyState
          icon={<Document className="h-6 w-6" />}
          title="No tenés estudios cargados todavía"
          description="Subí tu primer estudio médico para que Nuvio lo analice y te explique los resultados de forma clara."
          action={
            <Link href="/dashboard/subir">
              <span className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-6 py-3 text-body font-medium text-primary-foreground shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-primary-hover active:translate-y-0">
                Subir estudio
              </span>
            </Link>
          }
        />
      ) : (
        <>
          <StudyStatsGrid stats={stats} />

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="flex flex-col gap-4 lg:col-span-8">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-subheading text-primary">
                    Tus Estudios Recientes
                  </h2>
                  <p className="mt-1 text-caption text-muted-foreground">
                    Tus últimos estudios cargados y su estado al día.
                  </p>
                </div>
                <Link
                  href="/dashboard/estudios"
                  className="inline-flex min-h-11 items-center gap-1 text-body font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Ver todos ({stats.total})
                  <ChevronRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>

              {recent.length === 0 ? (
                <EmptyState
                  icon={<Document className="h-6 w-6" />}
                  title="Sin estudios recientes"
                  description="Cuando subas estudios, aparecerán acá."
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {recent.map((study, index) => (
                    <StudyCard key={study.id} study={study} showDelete={false} index={index} />
                  ))}
                </div>
              )}
            </div>

            <DashboardRail studies={studies} />
          </div>
        </>
      )}
    </div>
  );
}