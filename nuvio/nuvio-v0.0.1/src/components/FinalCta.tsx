"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { MotionLink } from "@/components/ui/MotionLink";
import {
  fadeInUpHero,
  fadeInUp,
  pulseSubtle,
  staggerContainer,
  getViewportOptions,
} from "@/lib/animation";

export default function FinalCta() {
  return (
    <motion.section
      className="on-dark relative overflow-hidden bg-gradient-to-b from-plum-surface to-primary py-20 text-center text-primary-foreground lg:py-24"
      aria-labelledby="cta-heading"
      initial="hidden"
      animate="visible"
      viewport={getViewportOptions()}
    >
      <motion.div
        className="radial-lilac-glow pointer-events-none absolute inset-0"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      />

      <motion.div
        className="relative mx-auto max-w-6xl px-6 lg:px-8"
        variants={staggerContainer}
      >
        <motion.span
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-caption font-medium text-primary-muted backdrop-blur-md"
          variants={fadeInUpHero}
          style={{ animationDelay: "0ms" }}
        >
          <motion.span
            className="status-dot h-1.5 w-1.5 rounded-full bg-lilac-glow"
            aria-hidden="true"
            // @ts-expect-error - pulseSubtle.animate is a valid target object
            animate={pulseSubtle.animate}
            // @ts-expect-error - accessing transition on target object
            transition={pulseSubtle.animate.transition}
          />
          Tu información médica, en tus manos
        </motion.span>

        <motion.h2
          id="cta-heading"
          className="mx-auto mt-6 max-w-3xl text-display text-white"
          variants={fadeInUpHero}
          style={{ animationDelay: "100ms" }}
        >
          Entendé tus estudios médicos con calma y certeza.
        </motion.h2>

        <motion.p
          className="mx-auto mt-5 max-w-xl text-body leading-body text-white/75"
          variants={fadeInUp}
          style={{ animationDelay: "200ms" }}
        >
          Subí tu documento y recibí una explicación clara para llevar a tu
          próxima consulta.
        </motion.p>

        <motion.div
          className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
          variants={staggerContainer}
          style={{ animationDelay: "300ms" }}
        >
          <MotionLink
            href="/auth/login"
            variants={fadeInUp}
            style={{ animationDelay: "0ms" }}
          >
            <Button variant="secondary" size="lg">
              Subir un documento
            </Button>
          </MotionLink>
          <motion.a
            href="#seguridad"
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-8 text-body font-medium text-white backdrop-blur-md transition-colors duration-150 hover:bg-white/15 sm:w-auto"
            variants={fadeInUp}
            style={{ animationDelay: "75ms" }}
          >
            Ver seguridad y privacidad
          </motion.a>
        </motion.div>

        <motion.p
          className="mt-6 text-caption text-white/55"
          variants={fadeInUp}
          style={{ animationDelay: "450ms" }}
        >
          Nuvio orienta tu comprensión; no reemplaza la consulta con un
          profesional de la salud.
        </motion.p>
      </motion.div>
    </motion.section>
  );
}