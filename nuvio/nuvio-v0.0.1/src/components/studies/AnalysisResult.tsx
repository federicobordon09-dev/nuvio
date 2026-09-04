import type { StudyAnalysis } from "@/lib/analysis/schema";
import {
  getStudyResultPresentation,
  getVisibleResultSections,
} from "@/lib/analysis/result-presentation";
import { StudyResultHeader } from "./StudyResultHeader";
import { FindingsSection } from "./FindingsSection";
import { MeasurementsSection } from "./MeasurementsSection";
import { AnalysisSection } from "./AnalysisSection";
import { MedicalDisclaimer } from "./MedicalDisclaimer";

/**
 * Componente principal de resultados de análisis médico.
 * Compone las secciones modulares adaptando el orden y la jerarquía
 * según el tipo de estudio (Fase 8.3).
 */
export function AnalysisResult({
  analysis,
}: {
  analysis: StudyAnalysis;
}) {
  const presentation = getStudyResultPresentation(analysis.study_type);
  const visibleSections = getVisibleResultSections(analysis);

  const isPrimary = (section: string) =>
    presentation.primarySection === section;

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

      {/* Secciones dinámicas según tipo de estudio */}
      {visibleSections.map((section) => {
        const primary = isPrimary(section);
        const label = presentation.labels?.[section];

        switch (section) {
          case "findings":
            return (
              <FindingsSection
                key="findings"
                findings={analysis.key_findings}
                title={label}
                primary={primary}
              />
            );
          case "measurements":
            return (
              <MeasurementsSection
                key="measurements"
                measurements={analysis.measurements}
                title={label}
                primary={primary}
              />
            );
          case "observations":
            return (
              <AnalysisSection
                key="observations"
                title="Observaciones"
                items={analysis.observations}
              />
            );
          case "warnings":
            return (
              <AnalysisSection
                key="warnings"
                title="Advertencias"
                items={analysis.warnings}
                variant="warning"
              />
            );
          case "recommendations":
            return (
              <AnalysisSection
                key="recommendations"
                title="Recomendaciones"
                items={analysis.recommendations}
              />
            );
          case "limitations":
            return (
              <AnalysisSection
                key="limitations"
                title="Limitaciones"
                items={analysis.limitations}
              />
            );
          default:
            return null;
        }
      })}

      {/* Disclaimer médico */}
      <MedicalDisclaimer />
    </div>
  );
}
