import ProductPreview from "./ProductPreview";
import { Button } from "@/components/ui/Button";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-40 lg:pb-32">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.04]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="dot-hero"
              x="0"
              y="0"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.4" fill="#251836" />
              <circle cx="14" cy="2" r="1.4" fill="#756B7D" />
              <circle cx="8" cy="14" r="1.4" fill="#251836" />
              <circle cx="20" cy="14" r="1.4" fill="#E6DFE9" />
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
            <h1 className="text-[32px] font-medium leading-[1.15] tracking-[-0.03em] text-foreground sm:text-[36px]">
              Tu información médica,
              <br />
              <span className="text-primary">entendida.</span>
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-[1.65] text-muted-foreground sm:text-[16px]">
              Subí un documento médico, análisis de sangre, resonancia,
              tomografía, y Nuvio lo transforma en una explicación clara que
              podés entender sin ser profesional de salud.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
