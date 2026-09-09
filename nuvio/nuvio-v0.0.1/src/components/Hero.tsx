import ProductPreview from "./ProductPreview";
import { Button } from "@/components/ui/Button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-40 lg:pb-32">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.03]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="dot-hero"
              x="0"
              y="0"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.2" fill="#251836" />
              <circle cx="18" cy="2" r="1.2" fill="#E6DFE9" />
              <circle cx="10" cy="18" r="1.2" fill="#251836" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-hero)" />
        </svg>
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          <div
            className="max-w-xl"
            style={{ animation: "fade-in-up 0.6s ease-out both" }}
          >
            <p className="data-label mb-4 text-muted-foreground">
              Plataforma de análisis de estudios médicos
            </p>
            <h1 className="text-display font-medium tracking-tight text-foreground">
              Tu información médica,
              <br />
              <span className="text-primary">entendida.</span>
            </h1>
            <p className="mt-6 max-w-md text-body leading-body text-muted-foreground">
              Subí un documento médico, análisis de sangre, resonancia,
              tomografía, y Nuvio lo transforma en una explicación clara que
              podés entender sin ser profesional de salud.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a href="/auth/login">
                <Button size="lg">Subir un documento</Button>
              </a>
              <a href="#como-funciona">
                <Button variant="secondary" size="lg">Cómo funciona</Button>
              </a>
            </div>
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
