import { Document, Shield, CheckBadge } from "@/components/ui/icons";

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
    <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-sm)] transition-all duration-200 ease-out hover:bg-muted/40 hover:shadow-[var(--shadow-md)] hover:border-border">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-muted text-primary">
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
