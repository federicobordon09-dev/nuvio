import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

/**
 * Input reutilizable. Soporta default, disabled, error, focus,
 * placeholder, aria-invalid, aria-describedby.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ error = false, className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={error || undefined}
        className={`h-10 w-full rounded-lg border bg-surface px-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? "border-danger" : "border-border"
        } ${className}`}
        {...props}
      />
    );
  },
);
