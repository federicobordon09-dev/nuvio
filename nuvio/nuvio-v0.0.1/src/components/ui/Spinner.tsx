interface SpinnerProps {
  className?: string;
  "aria-label"?: string;
}

/**
 * Spinner reutilizable. Centraliza la animación de carga
 * actualmente duplicada en múltiples componentes.
 */
export function Spinner({
  className = "h-4 w-4",
  "aria-label": ariaLabel,
}: SpinnerProps) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden={!ariaLabel}
      role={ariaLabel ? "status" : undefined}
      aria-label={ariaLabel}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
