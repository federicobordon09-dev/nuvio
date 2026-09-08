/**
 * Fase 10.5 — Aviso de la página de evolución de estudios.
 *
 * Reafirma el carácter informativo y objetivo de la evolución:
 * - no constituye un diagnóstico médico (mismo aviso que los resultados),
 * - los cambios mostrados son técnicos, sin interpretación clínica,
 * - aclara el símbolo ⊘ (valores no comparables numéricamente).
 */
export function EvolutionDisclaimer() {
  return (
    <div className="mt-6 flex flex-col gap-2 px-1">
      <p className="text-[12px] leading-[1.5] text-muted-foreground/80">
        Esta evolución es informativa y fue generada sobre el contenido
        analizado de cada estudio. No constituye un diagnóstico médico ni
        reemplaza la consulta con un profesional de salud.
      </p>
      <p className="text-[12px] leading-[1.5] text-muted-foreground/80">
        Los aumentos, disminuciones y estados mostrados son cambios objetivos
        entre un estudio y el siguiente. No indican por sí mismos si un valor
        es mejor o peor, y Nuvio no interpreta la evolución clínica.
      </p>
      <p className="text-[12px] leading-[1.5] text-muted-foreground/80">
        Los valores marcados con ⊘ no pudieron compararse numéricamente
        (valores no numéricos o unidades distintas).
      </p>
    </div>
  );
}