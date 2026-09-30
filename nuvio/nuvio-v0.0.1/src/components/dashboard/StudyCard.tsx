"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { formatFileSize, getStudyTypeLabelNullable } from "@/lib/studies-utils";
import type { StudyType } from "@/lib/studies-utils";
import { StudyStatusBadge } from "./StudyStatusBadge";
import { StudyDeleteButton } from "./StudyDeleteButton";
import { fadeInUp, getViewportOptions } from "@/lib/animation";

interface StudyCardProps {
  study: {
    id: string;
    file_name: string;
    study_type: StudyType | null;
    status: string;
    analysis_status: string;
    file_size: number;
    created_at: string;
  };
  showDelete?: boolean;
  index?: number;
}

export function StudyCard({
  study,
  showDelete = true,
  index = 0,
}: StudyCardProps) {
  return (
    <motion.div
      className="group rounded-xl border border-border bg-surface p-5 shadow-sm transition-all duration-150 ease-out hover:border-primary/20 hover:bg-primary-muted/30 hover:shadow-md"
      variants={fadeInUp}
      viewport={getViewportOptions()}
      style={{ animationDelay: `${index * 75}ms` }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <div className="flex items-start justify-between gap-4">
        <Link
          href={`/dashboard/estudios/${study.id}`}
          className="min-w-0 flex-1"
        >
          <motion.p
            className="truncate text-body font-medium text-foreground transition-colors group-hover:text-primary"
            whileHover={{ x: 4, transition: { duration: 0.2 } }}
          >
            {study.file_name}
          </motion.p>
          <p className="mt-1 text-caption text-muted-foreground">
            {getStudyTypeLabelNullable(study.study_type)}
          </p>
          <div className="mt-3">
            <StudyStatusBadge
              status={study.status}
              analysisStatus={study.analysis_status}
            />
          </div>
        </Link>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-3 text-caption text-muted-foreground">
            <span>{formatFileSize(study.file_size)}</span>
            <span>{new Date(study.created_at).toLocaleDateString("es-AR")}</span>
          </div>
          {showDelete && (
            <StudyDeleteButton studyId={study.id} studyName={study.file_name} />
          )}
        </div>
      </div>
    </motion.div>
  );
}