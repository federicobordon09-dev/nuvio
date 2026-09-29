import Image from "next/image";
import Link from "next/link";

const PLATFORM_LINKS = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#estudios", label: "Tipos de estudios" },
  { href: "#claridad", label: "Claridad sin ansiedad" },
  { href: "#seguridad", label: "Seguridad y privacidad" },
];

const ACCESS_LINKS = [
  { href: "/auth/login", label: "Ingresar o crear cuenta" },
  { href: "/dashboard", label: "Panel de estudios" },
];

const RESPONSIBILITY = [
  "Interpretación, no diagnóstico.",
  "Los resultados deben ser evaluados por un profesional de la salud.",
  "Consultá siempre con tu médico.",
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link href="/" className="flex items-center gap-3" aria-label="Nuvio">
              <Image
                src="/nuvio_logo_nuevo.png"
                alt="Nuvio"
                width={100}
                height={28}
                className="h-7 w-auto"
              />
              <span className="text-subheading text-primary">Nuvio</span>
            </Link>
            <p className="mt-4 max-w-md text-caption leading-body text-muted-foreground">
              Información médica compleja, explicada de forma clara: subí tu
              estudio y entendé tus resultados sin jerga y sin alarmismos.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              <li className="rounded-full border border-border bg-background px-3 py-1 text-caption text-muted-foreground">
                PDF, JPG y PNG
              </li>
              <li className="rounded-full border border-border bg-background px-3 py-1 text-caption text-muted-foreground">
                Tus estudios, bajo tu control
              </li>
            </ul>
          </div>

          <nav
            aria-label="Plataforma"
            className="flex flex-col gap-3 md:col-span-3"
          >
            <span className="text-caption font-medium uppercase tracking-caption text-primary">
              Plataforma
            </span>
            <ul className="flex flex-col gap-2">
              {PLATFORM_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="text-caption text-muted-foreground transition-colors duration-200 hover:text-foreground"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Acceso" className="flex flex-col gap-3 md:col-span-2">
            <span className="text-caption font-medium uppercase tracking-caption text-primary">
              Acceso
            </span>
            <ul className="flex flex-col gap-2">
              {ACCESS_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-caption text-muted-foreground transition-colors duration-200 hover:text-foreground"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-3 md:col-span-2">
            <span className="text-caption font-medium uppercase tracking-caption text-primary">
              Responsabilidad
            </span>
            <ul className="flex flex-col gap-2">
              {RESPONSIBILITY.map((item) => (
                <li
                  key={item}
                  className="text-caption leading-body text-muted-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-caption text-muted-foreground">
            Información médica compleja. Explicada de forma clara.
          </p>
          <p className="text-caption text-muted-foreground/70">
            &copy; {new Date().getFullYear()} Nuvio
          </p>
        </div>
      </div>
    </footer>
  );
}
