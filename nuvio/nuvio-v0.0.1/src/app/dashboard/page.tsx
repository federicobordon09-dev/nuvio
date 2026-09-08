import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getStudyStats, listStudies } from "@/lib/actions/studies";
import type { StudyStats } from "@/lib/studies-utils";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { StudyCard } from "@/components/dashboard/StudyCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle,
  Clock,
  InfoCircle,
  Warning,
  Upload,
  Document,
  Chat,
} from "@/components/ui/icons";

export const dynamic = "force-dynamic";

const RECENT_LIMIT = 4;

const statCards: Array<{
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
    icon: <InfoCircle />,
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
  // Verificar auth ANTES del try/catch para que redirect() no sea atrapado.
  // Un único client compartido entre auth check y data fetch — evita race
  // condition de refresh token entre getStudyStats y listStudies.
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
    // Solo tratar errores transitorios de red. Errores de autenticación ya
    // se manejan arriba con redirect().
    console.error("[nuvio:dashboard] Error cargando datos:", err);
  }

  const recent = studies.slice(0, RECENT_LIMIT);

  return (
    <div>
      <PageHeader
        title="Inicio"
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
          <section aria-label="Resumen de estudios" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => (
              <DashboardCard
                key={card.key}
                icon={card.icon}
                iconTone={card.iconTone}
                title={card.label}
                value={`${stats[card.key]} ${stats[card.key] === 1 ? "estudio" : "estudios"}`}
              />
            ))}
          </section>

          <section aria-label="Acciones rápidas" className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <DashboardCard
                key={action.href}
                href={action.href}
                icon={action.icon}
                iconTone={action.iconTone}
                title={action.label}
                description={action.description}
              />
            ))}
          </section>

          <section aria-label="Estudios recientes" className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[17px] font-medium tracking-[-0.01em] text-foreground">
                Estudios recientes
              </h2>
              <Link
                href="/dashboard/estudios"
                className="text-[14px] font-medium text-primary transition-colors hover:text-primary-700"
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
              <div className="space-y-4">
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
