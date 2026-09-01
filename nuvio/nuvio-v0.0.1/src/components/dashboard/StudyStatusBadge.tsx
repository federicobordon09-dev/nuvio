import { getStudyStatusLabel } from "@/lib/studies-utils";

const STYLES: Record<string, string> = {
  uploaded: "bg-cyan-50 text-cyan-700",
  processing: "bg-yellow-50 text-yellow-700",
  processed: "bg-green-50 text-green-700",
  error: "bg-red-50 text-red-700",
};

const DOTS: Record<string, string> = {
  uploaded: "bg-cyan-500",
  processing: "bg-yellow-500",
  processed: "bg-green-500",
  error: "bg-red-500",
};

export function StudyStatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? "bg-muted text-muted-foreground";
  const dot = DOTS[status] ?? "bg-muted-foreground";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-medium ${style}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {getStudyStatusLabel(status)}
    </span>
  );
}