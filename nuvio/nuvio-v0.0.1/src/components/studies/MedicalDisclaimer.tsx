"use client";

/**
 * Aviso legal médico — fijo al final de los resultados.
 * Nuvio explica información médica; no reemplaza a un profesional.
 */
export function MedicalDisclaimer() {
  return (
    <p className="mt-6 px-1 text-[12px] leading-[1.5] text-muted-foreground/80">
      Este análisis es informativo y fue generado por inteligencia artificial.
      No constituye un diagnóstico médico ni reemplaza la consulta con un
      profesional de salud.
    </p>
  );
}
