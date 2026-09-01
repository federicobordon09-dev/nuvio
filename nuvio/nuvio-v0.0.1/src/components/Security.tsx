export default function Security() {
  return (
    <section id="seguridad" aria-labelledby="seguridad-heading">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24 lg:px-8">
        <h2
          id="seguridad-heading"
          className="text-[22px] font-medium leading-[1.4] tracking-[-0.02em] text-foreground"
        >
          Tus datos están protegidos
        </h2>
        <p className="mt-3 max-w-lg text-[15px] leading-[1.6] text-muted-foreground">
          La privacidad es parte fundamental de la arquitectura de Nuvio, no una
          función adicional.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <Feature
            title="Interpretación, no diagnóstico"
            description="Nuvio es una herramienta de interpretación y educación. Nunca presenta sus resultados como un diagnóstico médico confirmado."
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                />
              </svg>
            }
          />
          <Feature
            title="Privacidad por diseño"
            description="No almacenamos tus documentos innecesariamente. No registramos contenido médico en logs. No exponemos documentos mediante URLs públicas."
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
            }
          />
          <Feature
            title="Responsabilidad primero"
            description="Cuando la información es insuficiente, Nuvio lo reconoce. La IA no inventa información y siempre recomienda consultar a un profesional."
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                />
              </svg>
            }
          />
        </div>
      </div>
    </section>
  );
}

function Feature({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ink-700/10 bg-white p-5 shadow-[0_1px_2px_rgba(11,20,38,0.04)] transition-all duration-200 ease-out hover:bg-muted/40 hover:shadow-[0_2px_8px_rgba(11,20,38,0.06)] hover:border-ink-700/15">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
        {icon}
      </div>
      <h3 className="text-[18px] font-medium leading-[1.4] text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
