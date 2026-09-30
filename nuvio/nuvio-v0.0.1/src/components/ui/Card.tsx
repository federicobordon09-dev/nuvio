"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cardInteractive } from "@/lib/animation";

type CardVariant = "default" | "elevated" | "outlined" | "interactive";
type CardPadding = "none" | "sm" | "md" | "lg";

interface CardProps {
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  children: ReactNode;
  hover?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: "border border-border bg-surface rounded-[20px]",
  elevated: "border border-border bg-surface rounded-[20px] shadow-md",
  outlined: "border border-border bg-transparent rounded-[20px]",
  interactive:
    "border border-border bg-surface rounded-[20px] transition-all duration-150 ease-out hover:shadow-md hover:border-primary/20 hover:bg-primary-muted/30 active:scale-[0.99]",
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
  hover = variant === "interactive",
}: CardProps) {
  if (!hover) {
    return (
      <div className={`${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={`${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
      whileHover={cardInteractive.hover}
      whileTap={cardInteractive.tap}
    >
      {children}
    </motion.div>
  );
}