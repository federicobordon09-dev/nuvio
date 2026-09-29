import { Button } from "@/components/ui/Button";

export default function FinalCta() {
  return (
    <section
      className="on-dark relative overflow-hidden bg-gradient-to-b from-plum-surface to-primary py-20 text-center text-primary-foreground lg:py-24"
      aria-labelledby="cta-heading"
    >
      <div className="radial-lilac-glow pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-caption font-medium text-primary-muted backdrop-blur-md">
          <span
            className="status-dot animate-pulse-subtle bg-lilac-glow"
            aria-hidden="true"
          />
          Tu información médica, en tus manos
        </span>

        <h2
          id="cta-heading"
          className="mx-auto mt-6 max-w-3xl text-display text-white"
        >
          Entendé tus estudios médicos con calma y certeza.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-body leading-body text-white/75">
          Subí tu documento y recibí una explicación clara para llevar a tu
          próxima consulta.
        </p>

        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <a href="/auth/login">
            <Button variant="secondary" size="lg">
              Subir un documento
            </Button>
          </a>
          <a
            href="#seguridad"
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-8 text-body font-medium text-white backdrop-blur-md transition-colors duration-150 hover:bg-white/15 sm:w-auto"
          >
            Ver seguridad y privacidad
          </a>
        </div>

        <p className="mt-6 text-caption text-white/55">
          Nuvio orienta tu comprensión; no reemplaza la consulta con un
          profesional de la salud.
        </p>
      </div>
    </section>
  );
}
