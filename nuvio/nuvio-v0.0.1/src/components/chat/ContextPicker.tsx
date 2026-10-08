"use client";

import { motion, type Variants } from "motion/react";
import { getStudyTypeLabelNullable } from "@/lib/studies-utils";
import type { SelectableStudy } from "@/lib/chat/schema";
import { fadeInUp, STAGGER } from "@/lib/animation";

interface ContextPickerProps {
  studies: SelectableStudy[];
  selectedIds: string[];
  onToggle: (studyId: string, checked: boolean) => void;
  error?: string | null;
}

const CHECKBOX_TRANSITION = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1] as const,
};

function StudyChip({
  study,
  checked,
  onToggle,
  index,
}: {
  study: SelectableStudy;
  checked: boolean;
  onToggle: (studyId: string, checked: boolean) => void;
  index: number;
}) {
  return (
    <motion.li
      variants={fadeInUp}
      style={{ animationDelay: `${index * STAGGER.tight * 1000}ms` }}
      whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
    >
      <label
        className={`relative inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-caption font-medium transition-colors duration-150 ${
          checked
            ? "border-primary bg-primary-muted text-primary"
            : "border-border-strong bg-surface text-muted-foreground hover:border-lilac-glow hover:text-foreground"
        }`}
      >
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onToggle(study.id, e.target.checked)}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-xl peer-focus-visible:ring-2 peer-focus-visible:ring-lilac-glow peer-focus-visible:ring-offset-2"
        />
        <motion.span
          className={`h-2 w-2 shrink-0 rounded-full ${
            checked ? "bg-primary" : "bg-outline-variant"
          }`}
          aria-hidden="true"
          animate={{ scale: checked ? 1 : 0.8 }}
          transition={CHECKBOX_TRANSITION}
        />
        <span className="max-w-[160px] truncate">
          {study.file_name}
        </span>
        <span className="text-plum-muted">
          {getStudyTypeLabelNullable(study.study_type)}
        </span>
      </label>
    </motion.li>
  );
}

export function ContextPicker({
  studies,
  selectedIds,
  onToggle,
  error,
}: ContextPickerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ staggerChildren: STAGGER.tight } as unknown as Variants}
    >
      <p className="data-label mb-2">Estudios de contexto</p>
      {studies.length === 0 ? (
        <motion.p
          className="text-caption text-muted-foreground"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          No tenés estudios listos. Analizá un estudio para poder consultarlo
          acá.
        </motion.p>
      ) : (
        <motion.ul className="flex flex-wrap gap-2" role="list">
          {studies.map((study, index) => {
            const checked = selectedIds.includes(study.id);
            return (
              <StudyChip
                key={study.id}
                study={study}
                checked={checked}
                onToggle={onToggle}
                index={index}
              />
            );
          })}
        </motion.ul>
      )}
      {error && (
        <motion.p
          className="mt-2 text-caption text-danger"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}