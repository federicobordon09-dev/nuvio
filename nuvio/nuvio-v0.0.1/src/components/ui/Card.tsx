import type { ReactNode } from "react";

type CardVariant = "default" | "elevated" | "outlined" | "interactive";
type CardPadding = "none" | "sm" | "md" | "lg";

interface CardProps {
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  children: ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default: "border border-border bg-surface rounded-xl",
  elevated: "border border-border bg-surface rounded-xl shadow-md",
  outlined: "border border-border bg-transparent rounded-xl",
  interactive:
    "border border-border bg-surface rounded-xl transition-all duration-150 ease-out hover:shadow-md hover:border-primary/20 hover:bg-primary-muted/30 active:scale-[0.99]",
};

const paddingStyles: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  variant = "default",
  padding = "md",
  className = "",
  children,
}: CardProps) {
  return (
    <div className={`${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}>
      {children}
    </div>
  );
}
