"use client";

import { motion } from "motion/react";
import { getSuggestedQuestions } from "@/lib/chat/suggested-questions";
import { Chat, Compare, ChevronRight, Shield } from "@/components/ui/icons";
import { MotionLink } from "@/components/ui/MotionLink";
import {
  fadeInUp,
  scaleInSpring,
  getViewportOptions,
  STAGGER,
} from "@/lib/animation";

interface DashboardRailProps {
  studies: Array<{ study_type: string | null }>;
}

export function DashboardRail({ studies }: DashboardRailProps) {
  const latestType = studies.find((s) => s.study_type !== null)?.study_type ?? null;
  const examples = getSuggestedQuestions(latestType).slice(0, 2);

  return (
    <aside aria-label="Accesos rápidos" className="flex flex-col gap-4 lg:col-span-4">
      {/* Chat IA */}
      <motion.section
        aria-labelledby="rail-chat-title"
        className="rounded-xl border border-border bg-surface p-6 shadow-sm"
        variants={fadeInUp}
        viewport={getViewportOptions()}
        whileHover={{ y: -2, boxShadow: "var(--shadow-md)", transition: { duration: 0.2 } }}
      >
        <motion.div
          className="flex items-center gap-3"
          variants={fadeInUp}
          style={{ animationDelay: "0ms" }}
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-muted text-primary"
          >
            <Chat className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 id="rail-chat-title" className="text-subheading text-primary">
              Tu asistente Nuvio
            </h2>
            <p className="text-caption text-muted-foreground">
              Preguntas sugeridas
            </p>
          </div>
        </motion.div>

        <motion.p
          className="mt-4 text-caption leading-body text-muted-foreground"
          variants={fadeInUp}
          style={{ animationDelay: "75ms" }}
        >
          Hablá con Nuvio sobre tus estudios y pedile que te explique los
          resultados en palabras claras.
        </motion.p>

        <motion.p
          className="mt-4 text-caption font-semibold text-primary"
          variants={fadeInUp}
          style={{ animationDelay: "125ms" }}
        >
          Ejemplos de preguntas
        </motion.p>

        <motion.ul
          className="mt-2 flex flex-col gap-2"
          variants={{ staggerChildren: STAGGER.tight }}
        >
          {examples.map((question, index) => (
            <motion.li
              key={question}
              className="flex items-start gap-2 rounded-md bg-background p-3 text-caption leading-body text-foreground"
              variants={scaleInSpring}
              style={{ animationDelay: `${index * STAGGER.tight * 1000}ms` }}
            >
              <Chat
                aria-hidden="true"
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lilac-glow"
              />
              <span>{question}</span>
            </motion.li>
          ))}
        </motion.ul>

        <MotionLink
          href="/dashboard/chat"
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-muted px-4 py-2.5 text-body font-medium text-primary transition-colors duration-150 hover:bg-primary-muted"
          variants={fadeInUp}
          style={{ animationDelay: "200ms" }}
          whileHover={{ x: 4, transition: { duration: 0.2 } }}
        >
          Ir al chat
          <ChevronRight className="h-4 w-4" />
        </MotionLink>
      </motion.section>

      {/* Comparar — tarjeta de navegación, sin valores inventados */}
      <motion.section
        aria-labelledby="rail-compare-title"
        className="on-dark relative overflow-hidden rounded-xl bg-gradient-to-br from-plum-surface via-primary to-primary p-6 shadow-md"
        variants={fadeInUp}
        viewport={getViewportOptions()}
        style={{ animationDelay: "150ms" }}
        whileHover={{ y: -2, boxShadow: "var(--shadow-lg)", transition: { duration: 0.2 } }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-lilac-glow/20 blur-2xl"
        />
        <motion.div
          className="relative flex flex-col gap-3"
          variants={{ staggerChildren: STAGGER.tight }}
        >
          <span className="inline-flex items-center gap-2 text-caption font-semibold text-primary-muted">
            <Compare aria-hidden="true" className="h-4 w-4 text-lilac-glow" />
            Comparar estudios
          </span>
          <motion.h2
            id="rail-compare-title"
            className="text-subheading text-white"
            variants={fadeInUp}
            style={{ animationDelay: "0ms" }}
          >
            Poné dos estudios lado a lado
          </motion.h2>
          <motion.p
            className="text-caption leading-body text-white/75"
            variants={fadeInUp}
            style={{ animationDelay: "50ms" }}
          >
            Elegí dos estudios y compará sus fechas, estados y resultados en una
            sola vista.
          </motion.p>
          <MotionLink
            href="/dashboard/comparar"
            className="mt-1 flex min-h-11 w-full items-center justify-between gap-2 rounded-md bg-white/10 px-4 py-2.5 text-body font-medium text-white transition-colors duration-150 hover:bg-white/20"
            variants={scaleInSpring}
            style={{ animationDelay: "100ms" }}
            whileHover={{ x: 4, transition: { duration: 0.2 } }}
          >
            Abrir comparador
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </MotionLink>
        </motion.div>
      </motion.section>

      {/* Privacidad — copy verificable, sin certificaciones */}
      <motion.div
        className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm"
        variants={fadeInUp}
        viewport={getViewportOptions()}
        style={{ animationDelay: "300ms" }}
      >
        <Shield
          aria-hidden="true"
          className="mt-0.5 h-5 w-5 shrink-0 text-primary"
        />
        <div className="min-w-0">
          <p className="text-caption font-semibold text-primary">
            Tus estudios, privados
          </p>
          <p className="mt-1 text-caption leading-body text-muted-foreground">
            Solo vos podés ver tus estudios y podés eliminarlos cuando quieras.
          </p>
        </div>
      </motion.div>
    </aside>
  );
}