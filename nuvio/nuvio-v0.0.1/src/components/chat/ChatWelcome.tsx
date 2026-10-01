"use client";

import { motion } from "motion/react";
import { MessageCircle, Plus } from "@/components/ui/icons";
import { MotionLink } from "@/components/ui/MotionLink";
import { fadeInUpHero, fadeInUp, scaleInSpring, staggerContainer, pulseScale } from "@/lib/animation";

export function ChatWelcome() {
  return (
    <motion.div
      className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-muted text-primary shadow-sm"
        aria-hidden="true"
        variants={pulseScale}
        animate="animate"
      >
        <MessageCircle className="h-7 w-7" />
      </motion.div>
      <motion.h1
        className="mt-5 text-heading text-primary"
        variants={fadeInUpHero}
        style={{ animationDelay: "100ms" }}
      >
        Chat IA sobre tus estudios
      </motion.h1>
      <motion.p
        className="mt-2 max-w-sm text-body text-muted-foreground"
        variants={fadeInUp}
        style={{ animationDelay: "175ms" }}
      >
        Creá una conversación, seleccioná uno de tus estudios y hacé preguntas
        sobre tus resultados.
      </motion.p>
      <MotionLink
        href="/dashboard/chat?new=1"
        className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-6 py-3 text-body font-medium text-primary-foreground shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-primary-hover hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lilac-glow focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0"
        aria-label="Crear nueva conversación"
        variants={scaleInSpring}
        style={{ animationDelay: "250ms" }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.98 }}
      >
        <Plus className="h-5 w-5" />
        Nueva conversación
      </MotionLink>
    </motion.div>
  );
}