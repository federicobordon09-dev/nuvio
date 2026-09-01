import ProductPreview from "./ProductPreview";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-44 lg:pb-32">
      {/* Dot pattern background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.035]"
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
              <circle cx="2" cy="2" r="1.5" fill="#0891B2" />
              <circle cx="14" cy="2" r="1.5" fill="#1A2744" />
              <circle cx="8" cy="14" r="1.5" fill="#2563EB" />
              <circle cx="20" cy="14" r="1.5" fill="#0B1426" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-hero)" />
        </svg>
        {/* Gradient overlay to fade dots at edges */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          {/* Text */}
          <div
            className="max-w-xl"
            style={{ animation: "fade-in-up 0.6s ease-out both" }}
          >
            <h1 className="text-[2.75rem] font-bold leading-[1.08] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-[3.5rem]">
              Tu información médica,
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #06B6D4, #3B82F6, #2563EB)",
                }}
              >
                entendida.
              </span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-[1.65] text-muted-foreground">
              Subí un documento médico, análisis de sangre, resonancia,
              tomografía, y Nuvio lo transforma en una explicación clara que
              podés entender sin ser profesional de salud.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href="#"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-ink-950 px-7 text-sm font-semibold text-primary-foreground shadow-[0_1px_2px_rgba(11,20,38,0.2),0_4px_12px_rgba(11,20,38,0.12)] transition-all duration-200 ease-out hover:bg-ink-900 hover:shadow-[0_2px_4px_rgba(11,20,38,0.2),0_8px_20px_rgba(11,20,38,0.14)] active:scale-[0.98]"
              >
                Subir un documento
              </a>
              <a
                href="#como-funciona"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-7 text-sm font-semibold text-foreground transition-all duration-200 ease-out hover:border-border/80 hover:bg-primary-50 active:scale-[0.98]"
              >
                Cómo funciona
              </a>
            </div>
          </div>

          {/* Product preview */}
          <div
            className="hidden lg:block"
            style={{ animation: "fade-in-up 0.6s ease-out 0.15s both" }}
          >
            <ProductPreview />
          </div>
        </div>

        {/* Mobile preview */}
        <div
          className="mt-16 lg:hidden"
          style={{ animation: "fade-in-up 0.6s ease-out 0.15s both" }}
        >
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
