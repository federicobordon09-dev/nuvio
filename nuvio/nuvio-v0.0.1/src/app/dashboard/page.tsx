import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStudyStats, listStudies } from "@/lib/actions/studies";
import { MAX_FILE_SIZE, type StudyStats } from "@/lib/studies-utils";
import { StudyCard } from "@/components/dashboard/StudyCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StudyStatsGrid } from "@/components/dashboard/StudyStatsGrid";
import { DashboardRail } from "@/components/dashboard/DashboardRail";
import { Button } from "@/components/ui/Button";
import { Document, Upload, Shield, ChevronRight } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

const RECENT_LIMIT = 4;

const MAX_FILE_MB = MAX_FILE_SIZE / (1024 * 1024);

function plural(n: number, singular: string, many: string): string {
  return n === 1 ? singular : many;
}

/**
 * Resumen del saludo construido únicamente con conteos reales
 * (`getStudyStats`). No hay números escritos a mano.
 */
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const { redirect } = await import("next/navigation");
    redirect("/auth/login");
  }

  let stats: StudyStats = { total: 0, ready: 0, in_progress: 0, pending: 0, errors: 0 };
  let studies: Awaited<ReturnType<typeof listStudies>> = [];
  try {
    const opts = { supabase, userId: user!.id };
    const [s, list] = await Promise.all([getStudyStats(opts), listStudies(opts)]);
    stats = s;
    studies = list;
  } catch (err) {
    console.error("[nuvio:dashboard] Error cargando datos:", err);
  }

  const recent = studies.slice(0, RECENT_LIMIT);
  const userName = user?.user_metadata?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Usuario";

  return (
    <div>
      {/* Encabezado de bienvenida + acceso rápido a la subida */}
      <section
        aria-labelledby="dashboard-greeting"
        className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-stretch"
      >
        <div className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary-muted/40 blur-3xl"
          />
          <div className="relative z-10 flex flex-col gap-3">
            <span className="inline-flex items-center gap-2 self-start rounded-full bg-primary-muted/60 px-3 py-1 text-caption font-medium text-primary">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 animate-pulse-subtle rounded-full bg-lilac-glow"
              />
              Resumen de tus estudios
            </span>
            <h1
              id="dashboard-greeting"
              className="text-title-lg text-primary"
            >
              Hola, {userName}
            </h1>
            <p className="max-w-xl text-body leading-body text-muted-foreground">
              {buildGreetingSummary(stats)}
            </p>
          </div>
          <div className="relative z-10 mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/subir"
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-6 py-3 text-body font-medium text-primary-foreground shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-primary-hover active:translate-y-0"
            >
              <Upload className="h-4 w-4" />
              Subir nuevo estudio
            </Link>
            <Link
              href="/dashboard/estudios"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border-strong bg-surface px-5 py-3 text-body font-medium text-primary transition-colors duration-150 hover:bg-background"
            >
              <Document className="h-4 w-4" />
              Ver mis estudios
            </Link>
          </div>
        </div>

        {/* Atajo de subida — enlace a la pantalla real de carga */}
        <Link
          href="/dashboard/subir"
          className="group flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-surface p-6 text-center shadow-sm transition-all duration-150 hover:shadow-md lg:w-96"
        >
          <span
            aria-hidden="true"
            className="mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-muted text-primary transition-transform duration-200 group-hover:scale-105"
          >
            <Upload className="h-6 w-6" />
          </span>
          <span className="text-subheading text-primary">Subí tu estudio</span>
          <span className="max-w-[240px] text-caption leading-body text-muted-foreground">
            PDF o imagen de tu estudio médico, hasta {MAX_FILE_MB} MB.
          </span>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-caption text-muted-foreground">
            <Shield aria-hidden="true" className="h-3.5 w-3.5" />
            Tus estudios son privados
          </span>
        </Link>
      </section>

      {stats.total === 0 ? (
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
          {/* Métricas reales por estado */}
          <StudyStatsGrid stats={stats} />

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            {/* Estudios recientes */}
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
                  {recent.map((study) => (
                    <StudyCard key={study.id} study={study} showDelete={false} />
                  ))}
                </div>
              )}
            </div>

            {/* Rail derecho */}
            <DashboardRail studies={studies} />
          </div>
        </>
      )}
    </div>
  );
}
