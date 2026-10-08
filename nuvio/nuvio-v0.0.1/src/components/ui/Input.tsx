"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { inputFocus } from "@/lib/animation";

interface InputProps extends Omit<HTMLMotionProps<"input">, "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration"> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { label, error, helperText, className = "", id, ...props },
    ref,
  ) {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <motion.div
        className="flex flex-col gap-1.5"
        initial={inputFocus.rest}
        animate={inputFocus.rest}
      >
        {label && (
          <label
            htmlFor={inputId}
            className="text-caption font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <motion.input
          ref={ref}
          id={inputId}
          className={`h-12 w-full rounded-md border border-border-strong bg-surface px-4 text-body text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:border-lilac-glow focus:ring-[3px] focus:ring-lilac-glow/20 disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? "border-danger focus:border-danger focus:ring-danger/20" : ""
          } ${className}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          whileFocus={inputFocus.focus}
          {...props}
        />
        {error && (
          <motion.p
            id={`${inputId}-error`}
            className="text-[12px] text-danger-strong"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            {error}
          </motion.p>
        )}
        {helperText && !error && (
          <motion.p
            id={`${inputId}-helper`}
            className="text-[12px] text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            {helperText}
          </motion.p>
        )}
      </motion.div>
    );
  },
);