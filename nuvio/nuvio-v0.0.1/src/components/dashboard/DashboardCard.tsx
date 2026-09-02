import Link from "next/link";
import type { ReactNode } from "react";

interface DashboardCardProps {
  icon: ReactNode;
  /** Clases de Tailwind para el tile del ícono (fondo + color). */
  iconTone?: string;
  title: string;
  description?: string;
  footer?: ReactNode;
  /** Si se provee, la tarjeta se convierte en un enlace. */
  href?: string;
  /** Valor destacado (p. ej. un conteo) mostrado bajo la descripción. */
  value?: ReactNode;
}

/**
 * Tarjeta del dashboard: ícono + título + descripción + valor/acción opcional.
 * Puede actuar como enlace (href) o como tarjeta informativa (stats).
 */
export function DashboardCard({
  icon,
  iconTone = "bg-ocean-tint text-ocean",
  title,
  description,
  footer,
  href,
  value,
}: DashboardCardProps) {
  const content = (
    <>
      <div
        className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${iconTone}`}
      >
        {icon}
      </div>
      <h3 className="text-[15px] font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-[13px] leading-[1.5] text-muted-foreground">
          {description}
        </p>
      )}
      {value && (
        <p className="mt-3 text-[13px] font-medium text-foreground">{value}</p>
      )}
      {footer}
    </>
  );

  const classes =
    "block h-full rounded-xl border border-border bg-surface p-5 transition-all duration-200";

  if (href) {
    return (
      <Link
        href={href}
        className={`${classes} group hover:border-ocean/20 hover:bg-ocean-tint/20`}
      >
        <h3 className="text-[15px] font-medium text-foreground transition-colors group-hover:text-ocean">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-[13px] leading-[1.5] text-muted-foreground">
            {description}
          </p>
        )}
        {value && (
          <p className="mt-3 text-[13px] font-medium text-foreground">{value}</p>
        )}
        {footer}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}
