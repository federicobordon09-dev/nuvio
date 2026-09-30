"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { motion } from "motion/react";
import { inputFocus } from "@/lib/animation";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, error, helperText, className = "", id, ...props },
    ref,
  ) {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <motion.div
        className="flex flex-col gap-1.5"
        initial={inputFocus.rest}
        animate={inputFocus.rest}
      >
        {label && (
          <label
            htmlFor={textareaId}
            className="text-caption font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <motion.textarea
          ref={ref}
          id={textareaId}
          className={`min-h-[80px] w-full rounded-md border border-border-strong bg-surface px-4 py-3 text-body text-foreground placeholder:text-muted-foreground resize-none transition-colors duration-150 focus:border-lilac-glow focus:ring-[3px] focus:ring-lilac-glow/20 disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? "border-danger focus:border-danger focus:ring-danger/20" : ""
          } ${className}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          whileFocus={inputFocus.focus}
          {...props}
        />
        {error && (
          <motion.p
            id={`${textareaId}-error`}
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
            id={`${textareaId}-helper`}
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