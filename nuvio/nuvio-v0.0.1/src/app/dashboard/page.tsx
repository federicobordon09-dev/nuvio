import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStudyStats, listStudies } from "@/lib/actions/studies";
import type { StudyStats } from "@/lib/studies-utils";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StudyCard } from "@/components/dashboard/StudyCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle,
  Clock,
  Warning,
  Upload,
  Document,
  Chat,
} from "@/components/ui/icons";

export const dynamic = "force-dynamic";

const RECENT_LIMIT = 4;

const statItems: Array<{
  key: keyof StudyStats;
  label: string;
  iconTone: string;
  icon: React.ReactNode;
}> = [
  {
    key: "ready",
    label: "Listos",
    iconTone: "bg-success-tint text-success",
    icon: <CheckCircle />,
  },
  {
    key: "in_progress",
    label: "En proceso",
    iconTone: "bg-primary-muted text-primary",
    icon: <Clock />,
  },
  {
    key: "pending",
    label: "Pendientes",
    iconTone: "bg-muted text-muted-foreground",
    icon: <Document />,
  },
  {
    key: "errors",
    label: "Con errores",
    iconTone: "bg-danger-tint text-danger",
    icon: <Warning />,
  },
];

const quickActions = [
  {
    label: "Subir estudio",
    description: "Subí un documento médico para analizar.",
    href: "/dashboard/subir",
    iconTone: "bg-primary-muted text-primary",
    icon: <Upload />,
  },
  {
    label: "Mis estudios",
    description: "Revisá todos tus estudios.",
    href: "/dashboard/estudios",
    iconTone: "bg-primary-muted text-primary",
    icon: <Document />,
  },
  {
    label: "Chat IA",
    description: "Hacé preguntas sobre tus estudios.",
    href: "/dashboard/chat",
    iconTone: "bg-primary-muted text-primary",
    icon: <Chat />,
  },
];

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
      <PageHeader
        title={`Hola, ${userName}`}
        description="Bienvenido a Nuvio. Cargá y entendé tus estudios médicos en un solo lugar."
      >
        <Link href="/dashboard/subir">
          <Button>Subir estudio</Button>
        </Link>
      </PageHeader>

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
          {/* Stats - Editorial style */}
          <section aria-label="Resumen de estudios" className="mb-10">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {statItems.map((stat) => (
                <div
                  key={stat.key}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.iconTone}`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-display font-medium text-foreground">
                      {stats[stat.key]}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions - Editorial list */}
          <section aria-label="Acciones rápidas" className="mb-10">
            <h2 className="text-subheading font-medium text-foreground mb-4">
              Acciones rápidas
            </h2>
            <div className="flex flex-col gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-all duration-150 ease-out hover:shadow-md hover:border-primary/20 hover:bg-primary-muted/30 active:scale-[0.99]"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.iconTone}`}>
                    {action.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium text-foreground group-hover:text-primary transition-colors">
                      {action.label}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Recent Studies - Editorial list */}
          <section aria-label="Estudios recientes">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-subheading font-medium text-foreground">
                Estudios recientes
              </h2>
              <Link
                href="/dashboard/estudios"
                className="text-body font-medium text-primary transition-colors hover:text-primary/80"
              >
                Ver todos
              </Link>
            </div>
            {recent.length === 0 ? (
              <EmptyState
                icon={<Document className="h-6 w-6" />}
                title="Sin estudios recientes"
                description="Cuando subas estudios, aparecerán acá."
              />
            ) : (
              <div className="space-y-3">
                {recent.map((study) => (
                  <StudyCard key={study.id} study={study} showDelete={false} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
