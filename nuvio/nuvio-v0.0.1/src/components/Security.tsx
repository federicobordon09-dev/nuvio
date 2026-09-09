import { Document, Shield, CheckBadge } from "@/components/ui/icons";

export default function Security() {
  return (
    <section id="seguridad" aria-labelledby="seguridad-heading">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:px-8">
        <p className="data-label mb-3 text-muted-foreground">
          Seguridad y privacidad
        </p>
        <h2
          id="seguridad-heading"
          className="text-heading font-medium tracking-tight text-foreground"
        >
          Tus datos están protegidos
        </h2>
        <p className="mt-3 max-w-lg text-body text-muted-foreground">
          La privacidad es parte fundamental de la arquitectura de Nuvio, no una
          función adicional.
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          <Feature
            title="Interpretación, no diagnóstico"
            description="Nuvio es una herramienta de interpretación y educación. Nunca presenta sus resultados como un diagnóstico médico confirmado."
            icon={<Document />}
          />
          <Feature
            title="Privacidad por diseño"
            description="No almacenamos tus documentos innecesariamente. No registramos contenido médico en logs. No exponemos documentos mediante URLs públicas."
            icon={<Shield />}
          />
          <Feature
            title="Responsabilidad primero"
            description="Cuando la información es insuficiente, Nuvio lo reconoce. La IA no inventa información y siempre recomienda consultar a un profesional."
            icon={<CheckBadge />}
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
    <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-sm)] transition-all duration-200 ease-out hover:shadow-[var(--shadow-md)] hover:border-border/80">
      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-muted text-primary">
        {icon}
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
