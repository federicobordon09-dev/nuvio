import {
  getStudyStageLabel,
  getStudyStageStyles,
  getStudyStageDotStyle,
} from "@/lib/studies-utils";

export function StudyStatusBadge({
  status,
  analysisStatus,
}: {
  status: string;
  analysisStatus?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-medium ${getStudyStageStyles(
        status,
        analysisStatus
      )}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${getStudyStageDotStyle(
          status,
          analysisStatus
        )}`}
      />
      {getStudyStageLabel(status, analysisStatus)}
    </span>
  );
}
