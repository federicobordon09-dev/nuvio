import { forwardRef, type TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

/**
 * Textarea reutilizable. Soporta default, disabled, error, focus,
 * placeholder, aria-invalid, aria-describedby.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ error = false, className = "", ...props }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={error || undefined}
        className={`min-h-[80px] w-full rounded-lg border bg-surface px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed resize-none ${
          error ? "border-danger" : "border-border"
        } ${className}`}
        {...props}
      />
    );
  },
);
