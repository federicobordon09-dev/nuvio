"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Spinner } from "./Spinner";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-hover hover:-translate-y-px active:translate-y-0 active:bg-primary/95 shadow-sm hover:shadow-md",
  secondary:
    "bg-surface text-primary border border-border-strong hover:bg-background active:bg-primary-subtle",
  ghost:
    "bg-transparent text-muted-foreground hover:text-foreground hover:bg-primary-muted/50 active:bg-primary-subtle/50",
  danger:
    "bg-danger text-white hover:bg-danger/90 active:bg-danger-strong shadow-sm",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-caption gap-1.5 rounded-md",
  md: "h-12 px-6 text-body gap-2 rounded-md",
  lg: "h-14 px-8 text-body gap-2 rounded-md",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center font-medium transition-all duration-150 ease-out focus-visible:ring-2 focus-visible:ring-lilac-glow focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-offset-4 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {loading && <Spinner className="shrink-0" />}
        {children}
      </button>
    );
  },
);
