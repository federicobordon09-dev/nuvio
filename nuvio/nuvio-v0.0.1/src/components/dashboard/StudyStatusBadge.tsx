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
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold leading-4 tracking-[0.04em] ${getStudyStageStyles(
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
