import Link from "next/link";
import { getSuggestedQuestions } from "@/lib/chat/suggested-questions";
import { Chat, Compare, ChevronRight, Shield } from "@/components/ui/icons";

interface DashboardRailProps {
  /** Filas ya cargadas por la página (solo se lee `study_type`). */
  studies: Array<{ study_type: string | null }>;
}

/**
 * Rail derecho del dashboard: atajo al Chat IA, atajo al comparador y
 * nota de privacidad. Todas las tarjetas son navegacionales: no inventan
 * métricas ni afirman análisis que la página no realiza.
 */
export function DashboardRail({ studies }: DashboardRailProps) {
  // Preguntas reales del pool según el tipo del estudio más reciente.
  const latestType = studies.find((s) => s.study_type !== null)?.study_type ?? null;
  const examples = getSuggestedQuestions(latestType).slice(0, 2);

  return (
    <aside
      aria-label="Accesos rápidos"
      className="flex flex-col gap-4 lg:col-span-4"
    >
      {/* Chat IA */}
      <section
        aria-labelledby="rail-chat-title"
        className="rounded-xl border border-border bg-surface p-6 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-muted text-primary"
          >
            <Chat className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 id="rail-chat-title" className="text-subheading text-primary">
              Tu asistente Nuvio
            </h2>
            <p className="text-caption text-muted-foreground">
              Preguntas sugeridas
            </p>
          </div>
        </div>

        <p className="mt-4 text-caption leading-body text-muted-foreground">
          Hablá con Nuvio sobre tus estudios y pedile que te explique los
          resultados en palabras claras.
        </p>

        <p className="mt-4 text-caption font-semibold text-primary">
          Ejemplos de preguntas
        </p>
        <ul className="mt-2 flex flex-col gap-2">
          {examples.map((question) => (
            <li
              key={question}
              className="flex items-start gap-2 rounded-md bg-background p-3 text-caption leading-body text-foreground"
            >
              <Chat
                aria-hidden="true"
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lilac-glow"
              />
              <span>{question}</span>
            </li>
          ))}
        </ul>

        <Link
          href="/dashboard/chat"
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-muted px-4 py-2.5 text-body font-medium text-primary transition-colors duration-150 hover:bg-primary-muted"
        >
          Ir al chat
          <ChevronRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Comparar — tarjeta de navegación, sin valores inventados */}
      <section
        aria-labelledby="rail-compare-title"
        className="on-dark relative overflow-hidden rounded-xl bg-gradient-to-br from-plum-surface via-primary to-primary p-6 shadow-md"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-lilac-glow/20 blur-2xl"
        />
        <div className="relative flex flex-col gap-3">
          <span className="inline-flex items-center gap-2 text-caption font-semibold text-primary-muted">
            <Compare aria-hidden="true" className="h-4 w-4 text-lilac-glow" />
            Comparar estudios
          </span>
          <h2 id="rail-compare-title" className="text-subheading text-white">
            Poné dos estudios lado a lado
          </h2>
          <p className="text-caption leading-body text-white/75">
            Elegí dos estudios y compará sus fechas, estados y resultados en una
            sola vista.
          </p>
          <Link
            href="/dashboard/comparar"
            className="mt-1 flex min-h-11 w-full items-center justify-between gap-2 rounded-md bg-white/10 px-4 py-2.5 text-body font-medium text-white transition-colors duration-150 hover:bg-white/20"
          >
            Abrir comparador
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Privacidad — copy verificable, sin certificaciones */}
      <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
        <Shield
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0 text-primary"
        />
        <div className="min-w-0">
          <p className="text-caption font-semibold text-primary">
            Tus estudios, privados
          </p>
          <p className="mt-1 text-caption leading-body text-muted-foreground">
            Solo vos podés ver tus estudios y podés eliminarlos cuando quieras.
          </p>
        </div>
      </div>
    </aside>
  );
}
