"use client";

import type { KeyFinding } from "@/lib/analysis/schema";
import { FindingRow } from "./FindingRow";
import { SectionAccordion } from "./SectionAccordion";

interface FindingsSectionProps {
  findings: KeyFinding[];
  title?: string;
  primary?: boolean;
  studyId: string;
}

export function FindingsSection({
  findings,
  title,
  primary,
  studyId,
}: FindingsSectionProps) {
  if (findings.length === 0) return null;

  return (
    <SectionAccordion
      title={title ?? "Hallazgos"}
      countLabel={`${findings.length} hallazgo${findings.length !== 1 ? "s" : ""}`}
      primary={primary}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {findings.map((finding, index) => (
          <FindingRow
            key={finding.title || index}
            finding={finding}
            studyId={studyId}
          />
        ))}
      </div>
    </SectionAccordion>
  );
}
