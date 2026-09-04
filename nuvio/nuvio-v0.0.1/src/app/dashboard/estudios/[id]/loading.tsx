import { PageHeader } from "@/components/dashboard/PageHeader";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";

/**
 * Skeleton de carga para la página de detalle de estudio.
 * Coherente con el diseño Fase 6 (Ocean / Ivory / Cream).
 * Sin animaciones pesadas ni shimmer excesivo.
 */
export default function EstudioDetailLoading() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Mis estudios", href: "/dashboard/estudios" },
          { label: "Cargando…" },
        ]}
      />

      <PageHeader
        title={<div className="h-6 w-3/4 animate-pulse rounded bg-muted" aria-hidden="true" />}
        description={<div className="h-4 w-1/2 animate-pulse rounded bg-muted" aria-hidden="true" />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
        {/* ── Columna principal (ancho) ─────────────────────── */}
        <div className="min-w-0 space-y-6">
          {/* Encabezado del resultado (simulado) */}
          <div className="rounded-xl border border-border bg-surface p-5 animate-pulse">
            <div className="h-4 w-1/3 rounded bg-muted mb-3" />
            <div className="space-y-2">
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
            </div>
          </div>

          {/* CTA principal (simulado) */}
          <div className="animate-pulse">
            <div className="h-11 w-full rounded-xl bg-muted" />
          </div>

          {/* Secciones de contenido (simuladas) */}
          <div className="space-y-5">
            {/* Section 1 */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="h-4 w-1/4 rounded bg-muted mb-3" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="h-28 rounded border border-border bg-muted" />
                <div className="h-28 rounded border border-border bg-muted" />
              </div>
            </div>

            {/* Section 2 */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="h-4 w-1/4 rounded bg-muted mb-3" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="h-32 rounded border border-border bg-muted" />
                <div className="h-32 rounded border border-border bg-muted" />
              </div>
            </div>

            {/* Section 3 (lista simple) */}
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="h-4 w-1/4 rounded bg-muted mb-3" />
              <div className="space-y-3">
                <div className="h-5 rounded bg-muted" />
                <div className="h-5 rounded bg-muted" />
                <div className="h-5 rounded bg-muted" />
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 px-1 h-5 w-full animate-pulse rounded bg-muted" />
        </div>

        {/* ── Columna secundaria (300px) ────────────────────── */}
        <aside className="space-y-6 animate-pulse">
          {/* Metadata */}
          <section className="rounded-xl border border-border bg-surface p-5">
            <dl className="space-y-4">
              <div>
                <div className="h-3 w-1/4 rounded bg-muted" />
                <div className="mt-1 h-4 w-3/4 rounded bg-muted" />
              </div>
              <div>
                <div className="h-3 w-1/4 rounded bg-muted" />
                <div className="mt-1 h-4 w-full rounded bg-muted" />
              </div>
              <div>
                <div className="h-3 w-1/4 rounded bg-muted" />
                <div className="mt-1 h-4 w-1/2 rounded bg-muted" />
              </div>
              <div>
                <div className="h-3 w-1/4 rounded bg-muted" />
                <div className="mt-1 h-4 w-1/3 rounded bg-muted font-mono" />
              </div>
              <div>
                <div className="h-3 w-1/4 rounded bg-muted" />
                <div className="mt-1 h-8 w-full rounded bg-muted" />
              </div>
            </dl>
          </section>

          {/* Acciones */}
          <section className="flex flex-col gap-3">
            <div className="h-11 w-full rounded-lg border border-muted bg-muted" />
            <div className="h-11 w-full rounded-lg border border-muted bg-muted" />
            <div className="h-11 w-full rounded-lg border border-muted bg-muted" />
          </section>

          {/* Contenido extraído (colapsado, simulado) */}
          <div className="rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <div className="h-4 w-1/3 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
              <div className="h-8 w-24 rounded-lg border border-muted bg-muted" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}