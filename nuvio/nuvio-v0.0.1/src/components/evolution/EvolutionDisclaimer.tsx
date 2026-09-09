export function EvolutionDisclaimer() {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary-muted/50 p-5">
      <div className="space-y-2">
        <p className="text-caption leading-body text-muted-foreground">
          Esta evolución es informativa y fue generada sobre el contenido
          analizado de cada estudio. No constituye un diagnóstico médico ni
          reemplaza la consulta con un profesional de salud.
        </p>
        <p className="text-caption leading-body text-muted-foreground">
          Los aumentos, disminuciones y estados mostrados son cambios objetivos
          entre un estudio y el siguiente. No indican por sí mismos si un valor
          es mejor o peor, y Nuvio no interpreta la evolución clínica.
        </p>
        <p className="text-caption leading-body text-muted-foreground">
          Los valores marcados con ⊘ no pudieron compararse numéricamente
          (valores no numéricos o unidades distintas).
        </p>
      </div>
    </div>
  );
}
