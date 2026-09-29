import { CheckCircle, X } from "@/components/ui/icons";

const PAINS = [
  "Valores y siglas sin contexto: no sabés qué es normal.",
  "No sabés qué preguntar ni qué es urgente.",
  "La terminología dispara búsquedas que aumentan la ansiedad.",
];

const GAINS = [
  "Cada marcador, explicado en lenguaje cotidiano.",
  "Preguntas sugeridas para llevarte a tu consulta.",
];

export default function ClarityComparison() {
  return (
    <section
      id="claridad"
      className="overflow-hidden bg-background"
      aria-labelledby="claridad-heading"
    >
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-caption font-medium uppercase tracking-caption text-violet">
            Tranquilidad y comprensión
          </p>
          <h2
            id="claridad-heading"
            className="mt-3 text-title-lg text-primary"
          >
            Claridad médica sin ansiedad
          </h2>
          <p className="mt-3 text-body leading-body text-muted-foreground">
            Comparamos el documento crudo que genera desasosiego con la
            explicación clara que te entrega Nuvio.
          </p>
        </div>

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-2">
          {/* ── Antes: informe crudo ── */}
          <div className="flex flex-col rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-sm)] sm:p-8">
            <div className="flex items-center justify-between gap-3 pb-4">
              <h3 className="text-caption font-medium uppercase tracking-caption text-muted-foreground">
                Lo que te entrega el laboratorio
              </h3>
              <span className="shrink-0 rounded-full bg-danger-tint px-2.5 py-1 text-caption font-medium text-danger-strong">
                Ininteligible
              </span>
            </div>

            <div className="space-y-3 rounded-lg bg-surface-container-low p-5 font-mono text-[13px] leading-6 text-muted-foreground">
              <p>PACIENTE: [DATOS OCULTOS] // INFORME DE LABORATORIO</p>
              <p className="text-foreground">
                Glucosa 108 mg/dL · Colesterol total 214 mg/dL · HDL 39 mg/dL ·
                LDL 141 mg/dL · Ferritina 12 ng/mL · TSH 4,8 mUI/L · VCM 88 fL
              </p>
              <p>
                CONCLUSIÓN: Hallazgos fuera del rango de referencia en algunos
                parámetros. Correlacionar con clínica.
              </p>
            </div>

            <ul className="mt-6 space-y-2.5 text-caption leading-body text-muted-foreground">
              {PAINS.map((pain) => (
                <li key={pain} className="flex items-start gap-2">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-danger-strong" />
                  <span>{pain}</span>
                </li>
              ))}
            </ul>

            <p className="mt-auto pt-6 text-center text-caption text-muted-foreground">
              Genera búsquedas caóticas que aumentan el estrés.
            </p>
          </div>

          {/* ── Después: explicación de Nuvio ── */}
          <div className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-lg)] sm:p-8">
            <div
              className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary-muted/50 blur-2xl"
              aria-hidden="true"
            />

            <div className="relative flex items-center justify-between gap-3 pb-4">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="flex h-6 w-6 items-center justify-center rounded-md bg-primary font-heading text-caption font-bold text-white"
                >
                  N
                </span>
                <h3 className="text-caption font-medium uppercase tracking-caption text-primary">
                  Lo que Nuvio te explica
                </h3>
              </div>
              <span className="shrink-0 rounded-full bg-success-tint px-2.5 py-1 text-caption font-medium text-success-strong">
                Lenguaje claro
              </span>
            </div>

            <div className="relative space-y-4 rounded-lg bg-primary-muted/30 p-5">
              <div>
                <span className="block text-caption font-semibold uppercase tracking-caption text-violet">
                  En palabras simples
                </span>
                <p className="mt-1 text-body font-medium leading-body text-primary">
                  Tu perfil está bien en general, con un par de marcadores
                  levemente fuera de su rango habitual que conviene comentar en
                  la consulta.
                </p>
              </div>
              <div>
                <span className="block text-caption font-semibold uppercase tracking-caption text-violet">
                  Qué implica
                </span>
                <p className="mt-1 flex items-start gap-2 text-caption leading-body text-foreground">
                  <span
                    className="status-dot mt-1.5 bg-success"
                    aria-hidden="true"
                  />
                  No hay señales de alarma en el informe; el punto a conversar
                  es el valor más alejado de su rango.
                </p>
              </div>
            </div>

            <ul className="relative mt-6 space-y-2.5 text-caption leading-body text-foreground">
              {GAINS.map((gain) => (
                <li key={gain} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>{gain}</span>
                </li>
              ))}
            </ul>

            <p className="relative mt-auto pt-6 text-center text-caption font-medium text-violet">
              Llegás a tu consulta con contexto y preguntas concretas.
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-caption text-muted-foreground">
          Ejemplo con fines ilustrativos.
        </p>
      </div>
    </section>
  );
}
