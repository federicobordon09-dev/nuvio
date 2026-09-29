"use client";

import { Shield } from "@/components/ui/icons";

/**
 * Aviso médico — siempre visible al final del análisis.
 * Tono informativo, sin prometer diagnóstico ni validación clínica.
 */
export function MedicalDisclaimer() {
  return (
    <footer className="rounded-[20px] border border-border bg-background p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-muted text-primary"
        >
          <Shield className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-subheading text-primary">Aviso médico</h3>
          <p className="mt-1.5 text-caption leading-body text-muted-foreground">
            Este análisis es informativo y fue generado por inteligencia
            artificial. No constituye un diagnóstico médico ni reemplaza la
            consulta con un profesional de salud.
          </p>
        </div>
      </div>
    </footer>
  );
}
