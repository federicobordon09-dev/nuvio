"use client";

import { motion, type Variants } from "motion/react";
import { getStudyTypeLabelNullable } from "@/lib/studies-utils";
import { formatStudyDate } from "@/lib/chat/dates";
import type { SelectableStudy } from "@/lib/chat/schema";
import { Check } from "@/components/ui/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MotionLink } from "@/components/ui/MotionLink";
import { fadeInUp, STAGGER } from "@/lib/animation";

const CHECKBOX_TRANSITION = {
  duration: 0.25,
  ease: [0.16, 1, 0.3, 1] as const,
};

const BADGE_TRANSITION = {
  duration: 0.2,
  ease: [0.16, 1, 0.3, 1] as const,
};

interface NewConversationStudyPickerProps {
  studies: SelectableStudy[];
  selectedIds: string[];
  onToggle: (studyId: string, checked: boolean) => void;
  onContinue: () => void;
  headingAs?: "h1" | "h2";
}

function StudyOption({
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
  const date = formatStudyDate(study.created_at ?? undefined);
  const typeLabel = getStudyTypeLabelNullable(study.study_type);

  return (
    <motion.li
      key={study.id}
      variants={fadeInUp}
      style={{ animationDelay: `${index * STAGGER.tight * 1000}ms` }}
    >
      <motion.button
        type="button"
        onClick={() => onToggle(study.id, !checked)}
        className={`flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lilac-glow focus-visible:ring-offset-2 ${
          checked
            ? "border-primary bg-primary-muted/50 ring-1 ring-primary/30"
            : "border-border-strong bg-surface hover:border-lilac-glow hover:bg-primary-muted/30"
        }`}
        aria-pressed={checked}
        whileHover={{ x: 4, transition: { duration: 0.15 } }}
        whileTap={{ scale: 0.99 }}
      >
        <motion.span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
            checked
              ? "border-primary bg-primary text-primary-foreground"
              : "border-outline-variant"
          }`}
          aria-hidden="true"
          initial={{ scale: checked ? 1 : 0.8 }}
          animate={{ scale: checked ? 1 : 0.8 }}
          transition={CHECKBOX_TRANSITION}
        >
          {checked && <Check className="h-4 w-4" />}
        </motion.span>

        <div className="min-w-0 flex-1">
          <span className="block truncate text-body font-medium text-foreground">
            {study.file_name}
          </span>
          <span className="mt-0.5 block text-caption text-muted-foreground">
            {date ? `${date} · ${typeLabel}` : typeLabel}
          </span>
          <motion.div
            className="mt-2"
            initial={{ opacity: checked ? 1 : 0, y: checked ? 0 : 8 }}
            animate={{ opacity: checked ? 1 : 0, y: checked ? 0 : 8 }}
            transition={BADGE_TRANSITION}
          >
            <Badge variant="success" size="sm" className="inline-flex">
              <Check className="h-3 w-3" />
              Analizado por Nuvio
            </Badge>
          </motion.div>
        </div>
      </motion.button>
    </motion.li>
  );
}

export function NewConversationStudyPicker({
  studies,
  selectedIds,
  onToggle,
  onContinue,
  headingAs = "h2",
}: NewConversationStudyPickerProps) {
  const hasSelection = selectedIds.length > 0;
  const Heading = headingAs;

  return (
    <motion.div
      className="mx-auto flex w-full max-w-lg flex-col px-4 py-8 sm:px-6"
      initial="hidden"
      animate="visible"
      variants={{ staggerChildren: STAGGER.section } as unknown as Variants}
    >
      <motion.div className="mb-6" variants={fadeInUp}>
        <Heading className="text-heading text-primary">
          ¿Sobre qué estudio querés hablar?
        </Heading>
        <p className="mt-2 text-body text-muted-foreground">
          Seleccioná un estudio para que Nuvio pueda ayudarte a entender tus
          resultados.
        </p>
      </motion.div>

      {studies.length === 0 ? (
        <motion.div
          className="rounded-2xl border border-border bg-surface px-6 py-10 text-center shadow-sm"
          variants={fadeInUp}
        >
          <p className="text-subheading text-primary">
            No tenés estudios listos
          </p>
          <p className="mt-2 max-w-sm text-caption text-muted-foreground">
            Subí y analizá un estudio para poder consultarlo acá.
          </p>
          <MotionLink
            href="/dashboard/subir"
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-body font-medium text-primary-foreground shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lilac-glow focus-visible:ring-offset-2 active:translate-y-0"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            Subir un estudio
          </MotionLink>
        </motion.div>
      ) : (
        <motion.ul className="flex flex-col gap-3" role="list" variants={{ staggerChildren: STAGGER.tight } as unknown as Variants}>
          {studies.map((study, index) => (
            <StudyOption
              key={study.id}
              study={study}
              checked={selectedIds.includes(study.id)}
              onToggle={onToggle}
              index={index}
            />
          ))}
        </motion.ul>
      )}

      {studies.length > 0 && (
        <motion.div variants={fadeInUp} style={{ animationDelay: "200ms" }}>
          <Button
            disabled={!hasSelection}
            onClick={onContinue}
            className="mt-6 w-full"
            size="lg"
            aria-label={
              hasSelection
                ? "Continuar con el estudio seleccionado"
                : "Elegí al menos un estudio para continuar"
            }
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            Continuar
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}