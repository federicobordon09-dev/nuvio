import type { StudyAnalysis } from "@/lib/analysis/schema";
import { FindingRow } from "./FindingRow";

// ── Section list helper ──────────────────────────────────────

function AnalysisSection({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant?: "warning";
}) {
  if (items.length === 0) return null;

  const isWarning = variant === "warning";

  return (
    <section
      aria-label={title}
      className={`rounded-xl border p-5 ${
        isWarning
          ? "border-warning/30 bg-warning-tint"
          : "border-border bg-surface"
      }`}
    >
      <h3
        className={`mb-2 text-[13px] font-semibold uppercase tracking-wide ${
          isWarning ? "text-warning-strong" : "text-muted-foreground"
        }`}
      >
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className={`text-[14px] leading-[1.6] ${
              isWarning ? "text-warning-strong" : "text-foreground/85"
            }`}
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Summary ──────────────────────────────────────────────────

function AnalysisSummary({
  summary,
  documentType,
}: {
  summary: string;
  documentType: string;
}) {
  return (
    <section
      aria-label="Resumen"
      className="rounded-xl border border-border bg-surface p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          Resumen
        </h3>
        {documentType && (
          <span className="rounded-full bg-ocean-tint px-3 py-1 text-[12px] font-medium text-ocean-dark">
            {documentType}
          </span>
        )}
      </div>
      <p className="text-[15px] leading-[1.6] text-foreground">{summary}</p>
    </section>
  );
}

// ── Findings ─────────────────────────────────────────────────

function AnalysisFindings({
  findings,
}: {
  findings: StudyAnalysis["key_findings"];
}) {
  if (findings.length === 0) return null;

  return (
    <section aria-label="Hallazgos principales">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          Hallazgos principales
        </h3>
        <span className="text-[12px] text-muted-foreground">
          {findings.length} hallazgo{findings.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {findings.map((finding, i) => (
          <FindingRow key={i} finding={finding} />
        ))}
      </div>
    </section>
  );
}

// ── Disclaimer ───────────────────────────────────────────────

function AnalysisDisclaimer() {
  return (
    <p className="px-1 text-[12px] leading-[1.5] text-muted-foreground/80">
      Este análisis es informativo y fue generado por inteligencia artificial.
      No constituye un diagnóstico médico ni reemplaza la consulta con un
      profesional de salud.
    </p>
  );
}

// ── Main component ───────────────────────────────────────────

export function AnalysisResult({
  analysis,
}: {
  analysis: StudyAnalysis;
}) {
  return (
    <div className="space-y-5">
      {/* Summary + document type */}
      <AnalysisSummary
        summary={analysis.summary}
        documentType={analysis.document_type}
      />

      {/* Key findings — grid compacto */}
      <AnalysisFindings findings={analysis.key_findings} />

      {/* Observations */}
      <AnalysisSection title="Observaciones" items={analysis.observations} />

      {/* Warnings */}
      <AnalysisSection
        title="Advertencias"
        items={analysis.warnings}
        variant="warning"
      />

      {/* Recommendations */}
      <AnalysisSection
        title="Recomendaciones"
        items={analysis.recommendations}
      />

      {/* Limitations */}
      <AnalysisSection title="Limitaciones" items={analysis.limitations} />

      {/* Disclaimer */}
      <AnalysisDisclaimer />
    </div>
  );
}
