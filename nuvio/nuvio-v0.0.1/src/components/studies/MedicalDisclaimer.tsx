"use client";

import { Shield } from "@/components/ui/icons";

export function MedicalDisclaimer() {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary-muted/50 p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-muted">
          <Shield className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="data-label !text-primary">
            Aviso médico
          </h3>
          <p className="mt-1.5 text-caption leading-body text-muted-foreground">
            Este análisis es informativo y fue generado por inteligencia artificial.
            No constituye un diagnóstico médico ni reemplaza la consulta con un
            profesional de salud.
          </p>
        </div>
      </div>
    </div>
  );
}
