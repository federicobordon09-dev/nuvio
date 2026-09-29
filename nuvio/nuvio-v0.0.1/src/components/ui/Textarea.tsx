import { forwardRef, type TextareaHTMLAttributes } from "react";

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
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-caption font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`min-h-[80px] w-full rounded-md border border-border-strong bg-surface px-4 py-3 text-body text-foreground placeholder:text-muted-foreground resize-none transition-colors duration-150 focus:border-lilac-glow focus:ring-[3px] focus:ring-lilac-glow/20 disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? "border-danger focus:border-danger focus:ring-danger/20" : ""
          } ${className}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="text-[12px] text-danger-strong">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${textareaId}-helper`} className="text-[12px] text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);
