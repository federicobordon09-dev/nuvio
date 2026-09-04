import type { StudyAnalysis } from "@/lib/analysis/schema";
import { StudyResultHeader } from "./StudyResultHeader";
import { FindingsSection } from "./FindingsSection";
import { MeasurementsSection } from "./MeasurementsSection";
import { AnalysisSection } from "./AnalysisSection";
import { MedicalDisclaimer } from "./MedicalDisclaimer";

/**
 * Componente principal de resultados de análisis médico.
 * Compone las secciones modulares: encabezado, hallazgos, mediciones,
 * observaciones, advertencias, recomendaciones, limitaciones y disclaimer.
 */
export function AnalysisResult({
  analysis,
}: {
  analysis: StudyAnalysis;
}) {
  return (
    <div className="space-y-5">
      {/* Encabezado: estado + tipo + resumen */}
      <StudyResultHeader
        studyType={analysis.study_type}
        documentType={analysis.document_type}
        summary={analysis.summary}
        status="processed"
        analysisStatus="completed"
      />

      {/* Hallazgos principales — grid compacto */}
      <FindingsSection findings={analysis.key_findings} />

      {/* Mediciones — valores numéricos */}
      <MeasurementsSection measurements={analysis.measurements} />

      {/* Observaciones */}
      <AnalysisSection title="Observaciones" items={analysis.observations} />

      {/* Advertencias — variante warning */}
      <AnalysisSection
        title="Advertencias"
        items={analysis.warnings}
        variant="warning"
      />

      {/* Recomendaciones */}
      <AnalysisSection title="Recomendaciones" items={analysis.recommendations} />

      {/* Limitaciones */}
      <AnalysisSection title="Limitaciones" items={analysis.limitations} />

      {/* Disclaimer médico */}
      <MedicalDisclaimer />
    </div>
  );
}
