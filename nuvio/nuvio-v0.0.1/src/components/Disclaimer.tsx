import { Warning } from "@/components/ui/icons";

export default function Disclaimer() {
  return (
    <section className="bg-background" aria-labelledby="aviso-heading">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <div className="max-w-4xl rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-sm)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-danger-tint text-danger"
            >
              <Warning className="h-6 w-6" />
            </span>
            <div>
              <h3
                id="aviso-heading"
                className="text-subheading text-primary"
              >
                Aviso importante
              </h3>
              <p className="mt-2 text-body leading-body text-muted-foreground">
                Nuvio proporciona información educativa, no diagnósticos
                médicos. Las explicaciones generadas por IA no sustituyen la
                evaluación de un profesional de salud. El significado clínico
                depende del contexto y debe ser evaluado por un profesional.
                Siempre consultá a tu médico para interpretar resultados
                clínicos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
