export default function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="bg-muted/30"
      aria-labelledby="como-funciona-heading"
    >
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24 lg:px-8">
        <h2
          id="como-funciona-heading"
          className="text-[22px] font-medium leading-[1.4] tracking-[-0.02em] text-foreground"
        >
          Cómo funciona
        </h2>
        <p className="mt-3 max-w-lg text-[15px] leading-[1.6] text-muted-foreground">
          Tres pasos simples para entender tus resultados.
        </p>

        <div className="relative mt-12">
          {/* Connecting line — sutil, no punteado */}
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-px sm:block"
            aria-hidden="true"
          >
            <div className="mx-16 h-full bg-ink-700/10" />
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <Step
              step="01"
              title="Subís tu documento"
              description="Elegí el archivo PDF o imagen de tu estudio médico. Nuvio lo recibe y valida de forma segura."
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
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                  />
                </svg>
              }
            />
            <Step
              step="02"
              title="Nuvio analiza la información"
              description="La IA procesa el contenido del documento y extrae los datos relevantes de tu estudio."
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
                    d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714a2.25 2.25 0 0 0 .659 1.591L19 14.5m-4.25-11.396c.251.023.501.05.75.082M12 21a8.966 8.966 0 0 0 5.982-2.275M12 21a8.966 8.966 0 0 1-5.982-2.275M15.75 3.186a24.284 24.284 0 0 1 2.263.082m-6.025-.082a24.29 24.29 0 0 0-2.263.082M5.018 18.725c.663-.37 1.386-.644 2.157-.81M18.982 18.725c-.663-.37-1.386-.644-2.157-.81M12 3.186c.389.028.777.06 1.163.095m-2.326 0c.389-.035.777-.067 1.163-.095m0 0a8.96 8.96 0 0 1 5.982 2.275M12 3.186a8.96 8.96 0 0 0-5.982 2.275"
                  />
                </svg>
              }
            />
            <Step
              step="03"
              title="Recibís una explicación clara"
              description="Entendé tus resultados, los valores importantes y qué preguntarle a tu médico."
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
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Step({
  step,
  title,
  description,
  icon,
}: {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative rounded-xl border border-ink-700/10 bg-white p-5 shadow-[0_1px_2px_rgba(11,20,38,0.04)] transition-all duration-200 ease-out hover:bg-muted/40 hover:shadow-[0_2px_8px_rgba(11,20,38,0.06)] hover:border-ink-700/15">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          {icon}
        </div>
        <span className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
          {step}
        </span>
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
