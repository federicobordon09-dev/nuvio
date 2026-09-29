/**
 * Aviso de la página de comparación de estudios.
 *
 * Reafirma el carácter informativo y objetivo de la comparación:
 * - no constituye un diagnóstico médico (mismo aviso que los resultados),
 * - los cambios mostrados son técnicos, sin interpretación clínica.
 *
 * La comparación es determinista: compara dos estudios reales cargados.
 * El texto no atribuye el resultado a un modelo ni a ninguna predicción.
 */
export function ComparisonDisclaimer() {
  return (
    <div className="rounded-[20px] border border-primary/20 bg-primary-muted/50 p-5">
      <div className="space-y-2">
        <p className="text-caption leading-body text-muted-foreground">
          Esta comparación es informativa y se calcula sobre el contenido de
          ambos estudios. No constituye un diagnóstico médico ni reemplaza la
          consulta con un profesional de salud.
        </p>
        <p className="text-caption leading-body text-muted-foreground">
          Los aumentos, disminuciones y estados mostrados son cambios objetivos
          entre los estudios. No indican por sí mismos si un valor es mejor o
          peor, ni implican una evolución clínica.
        </p>
      </div>
    </div>
  );
}
