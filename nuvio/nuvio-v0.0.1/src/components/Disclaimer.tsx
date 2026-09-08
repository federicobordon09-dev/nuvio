import { InfoCircle } from "@/components/ui/icons";

export default function Disclaimer() {
  return (
    <section className="bg-primary-muted/50">
      <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
        <div className="max-w-3xl rounded-xl border border-primary-200/50 bg-surface p-6 shadow-[var(--shadow-sm)] sm:p-7">
          <div className="flex gap-4">
            <InfoCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <h3 className="text-[15px] font-medium leading-[1.4] text-foreground">
                Aviso importante
              </h3>
              <p className="mt-2 text-[13px] leading-[1.6] text-muted-foreground">
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
