import Link from "next/link";
import type { ReactNode } from "react";

interface DashboardCardProps {
  icon: ReactNode;
  iconTone?: string;
  title: string;
  description?: string;
  footer?: ReactNode;
  href?: string;
  value?: ReactNode;
}

export function DashboardCard({
  icon,
  iconTone = "bg-primary-muted text-primary",
  title,
  description,
  footer,
  href,
  value,
}: DashboardCardProps) {
  const content = (
    <>
      <div className="mb-3 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconTone}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-body font-medium text-foreground">{title}</h3>
          {value && (
            <p className="text-caption text-muted-foreground">{value}</p>
          )}
        </div>
      </div>
      {description && (
        <p className="text-body text-muted-foreground">
          {description}
        </p>
      )}
      {footer}
    </>
  );

  const baseClasses = "block h-full rounded-xl border border-border bg-surface p-5 transition-all duration-150 ease-out animate-fade-in-up";

  if (href) {
    return (
      <Link
        href={href}
        className={`${baseClasses} hover:shadow-md hover:border-primary/20 hover:bg-primary-muted/30 active:scale-[0.99]`}
      >
        {content}
      </Link>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}
