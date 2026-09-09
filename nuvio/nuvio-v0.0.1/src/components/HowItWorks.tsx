import { Upload, Sparkles, CheckCircle } from "@/components/ui/icons";

export default function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="bg-muted/20"
      aria-labelledby="como-funciona-heading"
    >
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:px-8">
        <p className="data-label mb-3 text-muted-foreground">
          Proceso
        </p>
        <h2
          id="como-funciona-heading"
          className="text-heading font-medium tracking-tight text-foreground"
        >
          Cómo funciona
        </h2>
        <p className="mt-3 max-w-lg text-body text-muted-foreground">
          Tres pasos simples para entender tus resultados.
        </p>

        <div className="relative mt-14">
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-px sm:block"
            aria-hidden="true"
          >
            <div className="mx-16 h-full bg-border" />
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <Step
              step="01"
              title="Subís tu documento"
              description="Elegí el archivo PDF o imagen de tu estudio médico. Nuvio lo recibe y valida de forma segura."
              icon={<Upload />}
            />
            <Step
              step="02"
              title="Nuvio analiza la información"
              description="La IA procesa el contenido del documento y extrae los datos relevantes de tu estudio."
              icon={<Sparkles />}
            />
            <Step
              step="03"
              title="Recibís una explicación clara"
              description="Entendé tus resultados, los valores importantes y qué preguntarle a tu médico."
              icon={<CheckCircle />}
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
    <div className="relative rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-sm)] transition-all duration-200 ease-out hover:shadow-[var(--shadow-md)] hover:border-border/80">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-muted text-primary">
          {icon}
        </div>
        <span className="data-label uppercase">
          Paso {step}
        </span>
      </div>
      <h3 className="text-subheading font-medium text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-body text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
