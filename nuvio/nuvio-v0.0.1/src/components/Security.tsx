import { CheckBadge, InfoCircle, Shield, Trash } from "@/components/ui/icons";

const PRIVACY_POINTS = [
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Tus documentos, privados y cifrados",
    description:
      "Tus estudios se guardan de forma privada y cifrados en tu cuenta. No registramos el contenido médico en logs ni lo exponemos mediante URLs públicas.",
  },
  {
    icon: <Trash className="h-5 w-5" />,
    title: "Control total sobre tus estudios",
    description:
      "Vos decidís: podés eliminar tus estudios cuando quieras, directamente desde tu panel.",
  },
  {
    icon: <InfoCircle className="h-5 w-5" />,
    title: "Interpretación, no diagnóstico",
    description:
      "Nuvio es una herramienta de interpretación y educación. Nunca presenta sus resultados como un diagnóstico médico confirmado.",
  },
  {
    icon: <CheckBadge className="h-5 w-5" />,
    title: "Responsabilidad primero",
    description:
      "Cuando la información es insuficiente, Nuvio lo reconoce. La IA no inventa información y siempre recomienda consultar a un profesional.",
  },
];

const ACCOUNT_ROWS = [
  { label: "Archivos", value: "PDF, JPG y PNG" },
  { label: "Almacenamiento", value: "En tu cuenta" },
  { label: "Borrado", value: "Cuando lo pidas" },
];

export default function Security() {
  return (
    <section id="seguridad" className="bg-surface" aria-labelledby="seguridad-heading">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-caption font-medium uppercase tracking-caption text-violet">
              Seguridad y privacidad
            </p>
            <h2
              id="seguridad-heading"
              className="mt-3 text-title-lg text-primary"
            >
              Tus datos, protegidos y bajo tu control
            </h2>
            <p className="mt-4 max-w-xl text-body leading-body text-muted-foreground">
              Tu información de salud es lo más sensible que tenés. En Nuvio tus
              documentos se guardan de forma privada y cifrada, y siempre están
              bajo tu control.
            </p>

            <ul className="mt-8 space-y-5">
              {PRIVACY_POINTS.map(({ icon, title, description }) => (
                <li key={title} className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary">
                    {icon}
                  </span>
                  <div>
                    <h3 className="text-subheading text-primary">{title}</h3>
                    <p className="mt-0.5 text-caption leading-body text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="flex w-full max-w-md flex-col items-center rounded-xl bg-background p-8 text-center shadow-[var(--shadow-sm)]">
              <span
                aria-hidden="true"
                className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-muted shadow-[var(--shadow-md)]"
              >
                <Shield className="h-9 w-9" />
              </span>
              <h3 className="mt-1 text-heading text-primary">
                Tus estudios, en tu cuenta
              </h3>
              <p className="mt-2 max-w-xs text-caption leading-body text-muted-foreground">
                Cada estudio queda guardado en tu espacio personal, de forma
                privada y cifrada, asociado a tu sesión.
              </p>

              <ul className="mt-6 w-full space-y-2.5 rounded-lg bg-surface p-4 text-left">
                {ACCOUNT_ROWS.map(({ label, value }) => (
                  <li
                    key={label}
                    className="flex items-center justify-between gap-3 text-caption"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-primary">{value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
