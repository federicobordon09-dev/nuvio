"use client";

import { motion } from "motion/react";
import ProductPreview from "./ProductPreview";
import { Button } from "@/components/ui/Button";
import { Document, InfoCircle, Shield } from "@/components/ui/icons";
import { MotionLink } from "@/components/ui/MotionLink";
import {
  fadeInUpHero,
  fadeInUp,
  staggerContainer,
  float,
  pulseSubtle,
  getViewportOptions,
  scaleInSpring,
} from "@/lib/animation";

export default function Hero() {
  return (
    <section
      className="on-dark relative overflow-hidden bg-gradient-to-b from-plum-surface via-primary to-primary pt-28 pb-20 text-primary-foreground sm:pt-36 sm:pb-28 lg:pt-40 lg:pb-32"
      aria-labelledby="hero-heading"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <motion.div
          className="radial-lilac-glow absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.div
          className="absolute -left-40 -top-48 h-[560px] w-[560px] rounded-full bg-secondary-container/15 blur-[140px]"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
        <motion.div
          className="absolute -bottom-24 left-1/3 h-[320px] w-[480px] rounded-full bg-primary-muted/10 blur-[120px]"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <motion.div
          className="grid items-center gap-10 lg:grid-cols-[1fr_0.9fr] lg:gap-16"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          viewport={getViewportOptions()}
        >
          <motion.div
            className="max-w-xl"
            variants={fadeInUpHero}
            style={{ animationDelay: "0ms" }}
          >
            <motion.div
              className="mb-6 flex flex-wrap items-center gap-2"
              variants={fadeInUp}
              style={{ animationDelay: "0ms" }}
            >
              <motion.span
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-caption font-medium text-white/90 backdrop-blur-md"
                variants={scaleInSpring}
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
                Inteligencia clínica para pacientes
              </motion.span>
              <motion.span
                className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-caption font-medium text-white/70 backdrop-blur-md sm:inline-flex"
                variants={fadeInUp}
                style={{ animationDelay: "100ms" }}
              >
                <Shield className="h-3.5 w-3.5 text-lilac-glow" />
                Tus estudios, privados y cifrados
              </motion.span>
            </motion.div>

            <motion.h1
              id="hero-heading"
              className="text-display"
              variants={fadeInUpHero}
              style={{ animationDelay: "150ms" }}
            >
              Tu información médica,
              <br />
              <span className="bg-gradient-to-r from-surface via-primary-muted to-secondary-container bg-clip-text text-transparent">
                entendida.
              </span>
            </motion.h1>

            <motion.p
              className="mt-6 max-w-md text-body leading-body text-white/75"
              variants={fadeInUp}
              style={{ animationDelay: "250ms" }}
            >
              Subí un documento médico — análisis de sangre, resonancia,
              tomografía — y Nuvio lo transforma en una explicación clara que
              podés entender sin ser profesional de la salud.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col gap-3 sm:flex-row"
              variants={staggerContainer}
              style={{ animationDelay: "350ms" }}
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
                href="#como-funciona"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-8 text-body font-medium text-white backdrop-blur-md transition-colors duration-150 hover:bg-white/15"
                variants={fadeInUp}
                style={{ animationDelay: "75ms" }}
              >
                Cómo funciona
              </motion.a>
            </motion.div>

            <motion.ul
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-caption text-white/70"
              variants={staggerContainer}
              style={{ animationDelay: "500ms" }}
            >
              <motion.li
                className="inline-flex items-center gap-1.5"
                variants={fadeInUp}
                style={{ animationDelay: "0ms" }}
              >
                <Document className="h-4 w-4 text-lilac-glow" />
                PDF, JPG y PNG
              </motion.li>
              <motion.li
                className="inline-flex items-center gap-1.5"
                variants={fadeInUp}
                style={{ animationDelay: "50ms" }}
              >
                <Shield className="h-4 w-4 text-lilac-glow" />
                Tus documentos, privados y cifrados
              </motion.li>
              <motion.li
                className="inline-flex items-center gap-1.5"
                variants={fadeInUp}
                style={{ animationDelay: "100ms" }}
              >
                <InfoCircle className="h-4 w-4 text-lilac-glow" />
                No reemplaza a tu médico
              </motion.li>
            </motion.ul>
          </motion.div>

          <motion.div
            className="hidden lg:block"
            variants={fadeInUpHero}
            style={{ animationDelay: "200ms" }}
          >
            <motion.div
              className="relative"
              // @ts-expect-error - float.animate is a valid target object
              animate={float.animate}
              // @ts-expect-error - accessing transition on target object
              transition={float.animate.transition}
            >
              <div className="absolute -inset-4 rounded-2xl bg-lilac-glow/20 blur-2xl" />
              <ProductPreview />
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-12 lg:hidden"
          variants={fadeInUpHero}
          style={{ animationDelay: "200ms" }}
        >
          <motion.div
            className="relative"
            // @ts-expect-error - float.animate is a valid target object
            animate={float.animate}
            // @ts-expect-error - accessing transition on target object
            transition={float.animate.transition}
          >
            <div className="absolute -inset-4 rounded-2xl bg-lilac-glow/20 blur-2xl" />
            <ProductPreview />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}