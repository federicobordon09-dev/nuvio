export default function Disclaimer() {
  return (
    <section className="bg-primary-50/50">
      <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
        {/* Jerarquía distinta: fondo sutil primary-50, no blanco plano */}
        <div className="max-w-3xl rounded-xl border border-primary-200/50 bg-white p-6 shadow-[0_1px_2px_rgba(11,20,38,0.04)] sm:p-7">
          <div className="flex gap-4">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-primary-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
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
