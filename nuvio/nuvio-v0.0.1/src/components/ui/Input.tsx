import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
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
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-caption font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`h-12 w-full rounded-md border border-border-strong bg-surface px-4 text-body text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:border-lilac-glow focus:ring-[3px] focus:ring-lilac-glow/20 disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? "border-danger focus:border-danger focus:ring-danger/20" : ""
          } ${className}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-[12px] text-danger-strong">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-[12px] text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);
