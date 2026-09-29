import ProductPreview from "./ProductPreview";
import { Button } from "@/components/ui/Button";
import { Document, InfoCircle, Shield } from "@/components/ui/icons";

export default function Hero() {
  return (
    <section className="on-dark relative overflow-hidden bg-gradient-to-b from-plum-surface via-primary to-primary pt-28 pb-20 text-primary-foreground sm:pt-36 sm:pb-28 lg:pt-40 lg:pb-32">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="radial-lilac-glow absolute inset-0" />
        <div className="absolute -left-40 -top-48 h-[560px] w-[560px] rounded-full bg-secondary-container/15 blur-[140px]" />
        <div className="absolute -bottom-24 left-1/3 h-[320px] w-[480px] rounded-full bg-primary-muted/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          <div
            className="max-w-xl"
            style={{ animation: "fade-in-up 0.6s ease-out both" }}
          >
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-caption font-medium text-white/90 backdrop-blur-md">
                <span
                  className="status-dot animate-pulse-subtle bg-lilac-glow"
                  aria-hidden="true"
                />
                Inteligencia clínica para pacientes
              </span>
              <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-caption font-medium text-white/70 backdrop-blur-md sm:inline-flex">
                <Shield className="h-3.5 w-3.5 text-lilac-glow" />
                Tus estudios, privados y cifrados
              </span>
            </div>

            <h1 className="text-display">
              Tu información médica,
              <br />
              <span className="bg-gradient-to-r from-surface via-primary-muted to-secondary-container bg-clip-text text-transparent">
                entendida.
              </span>
            </h1>
            <p className="mt-6 max-w-md text-body leading-body text-white/75">
              Subí un documento médico — análisis de sangre, resonancia,
              tomografía — y Nuvio lo transforma en una explicación clara que
              podés entender sin ser profesional de la salud.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a href="/auth/login">
                <Button variant="secondary" size="lg">
                  Subir un documento
                </Button>
              </a>
              <a
                href="#como-funciona"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-8 text-body font-medium text-white backdrop-blur-md transition-colors duration-150 hover:bg-white/15"
              >
                Cómo funciona
              </a>
            </div>

            <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-caption text-white/70">
              <li className="inline-flex items-center gap-1.5">
                <Document className="h-4 w-4 text-lilac-glow" />
                PDF, JPG y PNG
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-lilac-glow" />
                Tus documentos, privados y cifrados
              </li>
              <li className="inline-flex items-center gap-1.5">
                <InfoCircle className="h-4 w-4 text-lilac-glow" />
                No reemplaza a tu médico
              </li>
            </ul>
          </div>

          <div
            className="hidden lg:block"
            style={{ animation: "fade-in-up 0.6s ease-out 0.15s both" }}
          >
            <ProductPreview />
          </div>
        </div>

        <div
          className="mt-12 lg:hidden"
          style={{ animation: "fade-in-up 0.6s ease-out 0.15s both" }}
        >
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
