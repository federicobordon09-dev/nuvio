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
  iconTone = "bg-primary-50 text-primary-600",
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
    "block h-full rounded-xl border border-ink-700/10 bg-white p-5 shadow-[0_1px_2px_rgba(11,20,38,0.04)] transition-all duration-200";

  if (href) {
    return (
      <Link
        href={href}
        className={`${classes} group hover:border-ink-700/15 hover:shadow-[0_2px_8px_rgba(11,20,38,0.06)]`}
      >
        <h3 className="text-[15px] font-medium text-foreground transition-colors group-hover:text-primary-600">
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
