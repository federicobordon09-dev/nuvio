"use client";

import { motion } from "motion/react";
import { getStudyTypeLabelNullable } from "@/lib/studies-utils";
import { formatStudyDate } from "@/lib/chat/dates";
import type { SelectableStudy } from "@/lib/chat/schema";
import { CheckCircle } from "@/components/ui/icons";
import { fadeInUp, scaleInSpring, STAGGER } from "@/lib/animation";

interface SelectedStudyBannerProps {
  studies: SelectableStudy[];
  selectedIds: string[];
  onChangeStudy: () => void;
}

export function SelectedStudyBanner({
  studies,
  selectedIds,
  onChangeStudy,
}: SelectedStudyBannerProps) {
  const selected = studies.filter((s) => selectedIds.includes(s.id));

  if (selected.length === 0) return null;

  return (
    <motion.div
      className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-border bg-background px-4 py-3 sm:px-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      variants={{ staggerChildren: STAGGER.tight }}
    >
      <motion.span
        aria-hidden="true"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-lilac-glow shadow-sm"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, ...scaleInSpring.transition }}
      >
        <CheckCircle className="h-4 w-4" />
      </motion.span>

      <motion.div className="min-w-0 flex-1" variants={fadeInUp} style={{ animationDelay: "50ms" }}>
        <p className="data-label">
          {selected.length === 1 ? "Estudio en foco" : "Estudios en foco"}
        </p>

        <motion.div className="mt-1.5 flex flex-wrap items-center gap-2" variants={{ staggerChildren: STAGGER.tight }}>
          {selected.map((study, index) => {
            const label = getStudyTypeLabelNullable(study.study_type);
            const date = formatStudyDate(study.created_at ?? undefined);
            return (
              <motion.span
                key={study.id}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-border-strong bg-surface px-3 py-1 text-caption font-medium text-primary shadow-sm"
                variants={scaleInSpring}
                style={{ animationDelay: `${index * STAGGER.tight * 1000}ms` }}
              >
                <span className="max-w-[170px] truncate">
                  {study.file_name}
                </span>
                <span className="hidden text-plum-muted sm:inline">
                  · {label}
                </span>
                {date && (
                  <span className="hidden text-plum-muted sm:inline">
                    · {date}
                  </span>
                )}
              </motion.span>
            );
          })}
        </motion.div>
      </motion.div>

      <motion.button
        type="button"
        onClick={onChangeStudy}
        className="ml-auto inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface px-4 text-caption font-medium text-primary transition-colors duration-150 hover:border-lilac-glow hover:bg-primary-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lilac-glow focus-visible:ring-offset-2"
        aria-label="Cambiar el estudio seleccionado"
        variants={scaleInSpring}
        style={{ animationDelay: "150ms" }}
        whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
        whileTap={{ scale: 0.98 }}
      >
        Cambiar estudio
      </motion.button>
    </motion.div>
  );
}