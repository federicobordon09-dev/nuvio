import type { ReactNode } from "react";

/**
 * Cabecera de página consistente: título + descripción opcional
 * + acciones opcionales (p. ej. un botón "Subir estudio").
 */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[24px] font-medium tracking-[-0.02em] text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-[14px] leading-[1.6] text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}
