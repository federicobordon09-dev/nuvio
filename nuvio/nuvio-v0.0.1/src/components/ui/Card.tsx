import type { ReactNode } from "react";

type CardVariant = "default" | "elevated" | "outlined";
type CardPadding = "sm" | "md" | "lg";

interface CardProps {
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  children: ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default: "border border-border bg-surface rounded-xl",
  elevated: "border border-border bg-surface rounded-xl shadow-sm",
  outlined: "border border-border bg-transparent rounded-xl",
};

const paddingStyles: Record<CardPadding, string> = {
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
