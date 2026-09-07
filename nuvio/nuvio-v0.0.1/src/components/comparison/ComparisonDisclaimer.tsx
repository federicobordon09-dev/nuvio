/**
 * Aviso de la página de comparación de estudios.
 *
 * Reafirma el carácter informativo y objetivo de la comparación:
 * - no constituye un diagnóstico médico (mismo aviso que los resultados),
 * - los cambios mostrados son técnicos, sin interpretación clínica.
 */
export function ComparisonDisclaimer() {
  return (
    <div className="mt-6 flex flex-col gap-2 px-1">
      <p className="text-[12px] leading-[1.5] text-muted-foreground/80">
        Esta comparación es informativa y fue generada por inteligencia
        artificial sobre el contenido de ambos estudios. No constituye un
        diagnóstico médico ni reemplaza la consulta con un profesional de
        salud.
      </p>
      <p className="text-[12px] leading-[1.5] text-muted-foreground/80">
        Los aumentos, disminuciones y estados mostrados son cambios objetivos
        entre los estudios. No indican por sí mismos si un valor es mejor o
        peor, ni implican una evolución clínica.
      </p>
    </div>
  );
}