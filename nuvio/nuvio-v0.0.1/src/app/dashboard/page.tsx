import Link from "next/link";
import { getStudyStats, listStudies } from "@/lib/actions/studies";
import type { StudyStats } from "@/lib/studies-utils";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { StudyCard } from "@/components/dashboard/StudyCard";
import { EmptyState } from "@/components/dashboard/EmptyState";

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
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    key: "in_progress",
    label: "En proceso",
    iconTone: "bg-ocean-tint text-ocean",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    key: "pending",
    label: "Pendientes",
    iconTone: "bg-muted text-muted-foreground",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    ),
  },
  {
    key: "errors",
    label: "Con errores",
    iconTone: "bg-danger-tint text-danger",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
    ),
  },
];

const quickActions = [
  {
    label: "Subir estudio",
    description: "Subí un documento médico para analizar.",
    href: "/dashboard/subir",
    iconTone: "bg-ocean-tint text-ocean",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    label: "Mis estudios",
    description: "Revisá todos tus estudios.",
    href: "/dashboard/estudios",
    iconTone: "bg-ocean-tint text-ocean",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
  },
  {
    label: "Chat IA",
    description: "Hacé preguntas sobre tus estudios.",
    href: "/dashboard/chat",
    iconTone: "bg-ocean-tint text-ocean",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    ),
  },
];

export default async function DashboardPage() {
  let stats: StudyStats = { total: 0, ready: 0, in_progress: 0, pending: 0, errors: 0 };
  let studies: Awaited<ReturnType<typeof listStudies>> = [];
  try {
    const [s, list] = await Promise.all([getStudyStats(), listStudies()]);
    stats = s;
    studies = list;
  } catch {
    // Estados vacíos seguros ante errores transitorios.
  }

  const recent = studies.slice(0, RECENT_LIMIT);

  return (
    <div>
      <PageHeader
        title="Inicio"
        description="Bienvenido a Nuvio. Cargá y entendé tus estudios médicos en un solo lugar."
      >
        <Link
          href="/dashboard/subir"
          className="inline-flex rounded-lg bg-primary-600 px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primary-700"
        >
          Subir estudio
        </Link>
      </PageHeader>

      {stats.total === 0 ? (
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
                className="text-[14px] font-medium text-ocean transition-colors hover:text-ocean-dark"
              >
                Ver todos
              </Link>
            </div>
            {recent.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                }
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
