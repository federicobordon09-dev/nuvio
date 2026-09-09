import type { ReactNode } from "react";

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "muted";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-success-tint text-success-strong",
  warning: "bg-warning-tint text-warning-strong",
  error: "bg-danger-tint text-danger-strong",
  info: "bg-primary-muted text-primary",
  neutral: "bg-primary-muted text-primary",
  muted: "bg-background text-muted-foreground",
};

const dotColor: Record<BadgeVariant, string> = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-danger",
  info: "bg-primary",
  neutral: "bg-primary",
  muted: "bg-muted-foreground",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-0.5 text-caption",
};

/**
 * Badge / StatusPill reutilizable.
 * El texto siempre comunica el estado — no depende solo del color.
 */
export function Badge({
  variant = "muted",
  size = "md",
  dot = false,
  className = "",
  children,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor[variant]}`} />
      )}
      {children}
    </span>
  );
}
