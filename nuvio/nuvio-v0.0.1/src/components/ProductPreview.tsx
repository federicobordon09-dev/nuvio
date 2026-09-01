export default function ProductPreview() {
  return (
    <div
      className="relative"
      style={{ animation: "float 6s ease-in-out infinite" }}
    >
      <div className="absolute -inset-4 rounded-2xl bg-primary-500/[0.03] blur-2xl" />

      {/* Borde punteado — único elemento con este tratamiento: "documento siendo procesado" */}
      <div className="relative rounded-xl border border-dashed border-ink-700/20 bg-surface shadow-[0_1px_3px_rgba(11,20,38,0.04),0_8px_24px_rgba(11,20,38,0.06)]">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-border/40 px-5 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-border/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-border/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-border/60" />
          </div>
          <span className="ml-2 text-[11px] font-medium text-muted-foreground/60">
            nuvio / análisis
          </span>
        </div>

        <div className="p-5">
          {/* File block — borde sólido fino, no punteado */}
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-ink-700/10 bg-muted/20 px-4 py-3">
            <svg
              className="h-4 w-4 shrink-0 text-muted-foreground/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
            <div className="flex-1 truncate text-[13px] text-muted-foreground/70">
              analisis_sangre_2026.pdf
            </div>
            <span className="rounded-[6px] bg-[var(--status-normal-bg)] px-2 py-0.5 text-[12px] font-medium text-[var(--status-normal)]">
              Analizado
            </span>
          </div>

          {/* Result header */}
          <div className="mb-3">
            <h4 className="text-[13px] font-medium text-foreground">
              Análisis de sangre completo
            </h4>
            <p className="mt-0.5 text-[12px] leading-[1.4] text-muted-foreground">
              14 de marzo de 2026
            </p>
          </div>

          {/* Result values — borde sólido fino */}
          <div className="space-y-2">
            <ResultRow
              label="Glucosa"
              value="105 mg/dL"
              range="70–100"
              status="high"
            />
            <ResultRow
              label="Colesterol total"
              value="195 mg/dL"
              range="< 200"
              status="normal"
            />
            <ResultRow
              label="Hemoglobina"
              value="14.2 g/dL"
              range="13.5–17.5"
              status="normal"
            />
          </div>

          {/* Explanation */}
          <div className="mt-4 rounded-lg bg-cyan-500/[0.04] p-4">
            <p className="text-[12px] leading-[1.6] text-muted-foreground">
              <span className="font-medium text-foreground">
                Qué significa:
              </span>{" "}
              Tu glucosa aparece levemente por encima del rango normal. Esto
              puede estar relacionado con la alimentación reciente. Conviene
              comentarlo con tu médico.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  range,
  status,
}: {
  label: string;
  value: string;
  range: string;
  status: "normal" | "high" | "low";
}) {
  const statusStyles = {
    normal: "bg-[var(--status-normal-bg)] text-[var(--status-normal)]",
    high: "bg-[var(--status-elevated-bg)] text-[var(--status-elevated)]",
    low: "bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
  }[status];

  const statusLabel = {
    normal: "Normal",
    high: "Elevado",
    low: "Bajo",
  }[status];

  return (
    <div className="flex items-center justify-between rounded-lg border border-ink-700/10 px-3 py-2">
      <div className="flex-1">
        <span className="text-[12px] font-medium text-foreground">
          {label}
        </span>
        <span className="ml-2 text-[11px] text-muted-foreground">
          Ref: {range}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-medium tabular-nums text-foreground">
          {value}
        </span>
        <span
          className={`rounded-[6px] px-2 py-0.5 text-[12px] font-medium ${statusStyles}`}
        >
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
