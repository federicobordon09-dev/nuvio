import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Estado vacío compartido: ícono + título + descripción + acción opcional.
 * Se usa para listas sin datos y páginas "próximamente".
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card padding="lg">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-muted text-primary">
          {icon}
        </div>
        <h3 className="text-[15px] font-medium text-foreground">{title}</h3>
        {description && (
          <p className="mt-1.5 max-w-sm text-[13px] leading-[1.6] text-muted-foreground">
            {description}
          </p>
        )}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </Card>
  );
}
