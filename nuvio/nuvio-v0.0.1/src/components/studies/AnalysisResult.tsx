import type { StudyAnalysis, FindingStatus } from "@/lib/analysis/schema";

// ── Status labels & colors ───────────────────────────────────

const STATUS_LABELS: Record<FindingStatus, string> = {
  normal: "Normal",
  high: "Elevado",
  low: "Bajo",
  abnormal: "Anormal",
  unknown: "Sin datos",
};

const STATUS_STYLES: Record<FindingStatus, string> = {
  normal: "bg-green-50 text-green-700",
  high: "bg-red-50 text-red-700",
  low: "bg-blue-50 text-blue-700",
  abnormal: "bg-orange-50 text-orange-700",
  unknown: "bg-gray-100 text-gray-600",
};

function FindingStatusBadge({ status }: { status: FindingStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] font-medium ${STATUS_STYLES[status] ?? STATUS_STYLES.unknown}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
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
    <div className="rounded-xl border border-ink-700/10 bg-white p-6 shadow-[0_1px_2px_rgba(11,20,38,0.04)]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-medium text-foreground">Resumen</h3>
        {documentType && (
          <span className="rounded-full bg-primary-50 px-3 py-1 text-[13px] font-medium text-primary-700">
            {documentType}
          </span>
        )}
      </div>
      <p className="text-[14px] leading-[1.6] text-foreground">{summary}</p>
    </div>
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
    <div className="rounded-xl border border-ink-700/10 bg-white shadow-[0_1px_2px_rgba(11,20,38,0.04)]">
      <div className="border-b border-ink-700/10 px-6 py-4">
        <h3 className="text-[15px] font-medium text-foreground">
          Hallazgos principales
        </h3>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          {findings.length} hallazgo{findings.length !== 1 ? "s" : ""}{" "}
          identificado{findings.length !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="divide-y divide-ink-700/10">
        {findings.map((finding, i) => (
          <div key={i} className="px-6 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h4 className="text-[15px] font-medium text-foreground">
                    {finding.title}
                  </h4>
                  <FindingStatusBadge status={finding.status} />
                </div>
                <p className="mt-1.5 text-[20px] font-semibold text-foreground">
                  {finding.value}
                  {finding.unit && (
                    <span className="ml-1 text-[14px] font-normal text-muted-foreground">
                      {finding.unit}
                    </span>
                  )}
                </p>
                {finding.reference_range && (
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    Referencia: {finding.reference_range}
                  </p>
                )}
              </div>
            </div>
            <p className="mt-3 text-[14px] leading-[1.6] text-foreground/80">
              {finding.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

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

  return (
    <div
      className={`rounded-xl border p-6 shadow-[0_1px_2px_rgba(11,20,38,0.04)] ${
        variant === "warning"
          ? "border-amber-200 bg-amber-50"
          : "border-ink-700/10 bg-white"
      }`}
    >
      <h3
        className={`mb-3 text-[15px] font-medium ${
          variant === "warning" ? "text-amber-800" : "text-foreground"
        }`}
      >
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className={`text-[14px] leading-[1.6] ${
              variant === "warning"
                ? "text-amber-700"
                : "text-foreground/80"
            }`}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Disclaimer ───────────────────────────────────────────────

function AnalysisDisclaimer() {
  return (
    <div className="rounded-xl border border-ink-700/10 bg-muted/30 p-4">
      <p className="text-[13px] leading-[1.5] text-muted-foreground">
        Este análisis es informativo y fue generado por inteligencia artificial.
        No constituye un diagnóstico médico ni reemplaza la consulta con un
        profesional de salud.
      </p>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────

export function AnalysisResult({
  analysis,
}: {
  analysis: StudyAnalysis;
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-ink-700/10 bg-white px-6 py-4 shadow-[0_1px_2px_rgba(11,20,38,0.04)]">
        <h2 className="text-[15px] font-medium text-foreground">
          Análisis de IA
        </h2>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Generado a partir del contenido del documento
        </p>
      </div>

      {/* Summary + document type */}
      <AnalysisSummary
        summary={analysis.summary}
        documentType={analysis.document_type}
      />

      {/* Key findings */}
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
