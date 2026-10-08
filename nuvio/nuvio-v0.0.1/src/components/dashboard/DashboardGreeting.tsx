"use client";

import { motion, type Variants } from "motion/react";
import { Upload, Document, Shield } from "@/components/ui/icons";
import { MotionLink } from "@/components/ui/MotionLink";
import { fadeInUp, scaleInSpring, getViewportOptions, STAGGER } from "@/lib/animation";

interface DashboardGreetingProps {
  userName: string;
  greetingSummary: string;
  maxFileMB: number;
}

export function DashboardGreeting({ userName, greetingSummary, maxFileMB }: DashboardGreetingProps) {
  return (
    <motion.section
      aria-labelledby="dashboard-greeting"
      className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-stretch"
      initial="hidden"
      animate="visible"
      viewport={getViewportOptions()}
      variants={{ staggerChildren: STAGGER.section } as unknown as Variants}
    >
      <motion.div
        className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8"
        variants={fadeInUp}
        style={{ animationDelay: "0ms" }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary-muted/40 blur-3xl animate-float"
        />
        <motion.div className="relative z-10 flex flex-col gap-3" variants={{ staggerChildren: STAGGER.tight } as unknown as Variants}>
          <motion.span
            className="inline-flex items-center gap-2 self-start rounded-full bg-primary-muted/60 px-3 py-1 text-caption font-medium text-primary"
            variants={scaleInSpring}
          >
            <motion.span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-lilac-glow"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
            />
            Resumen de tus estudios
          </motion.span>
          <motion.h1
            id="dashboard-greeting"
            className="text-title-lg text-primary"
            variants={fadeInUp}
          >
            Hola, {userName}
          </motion.h1>
          <motion.p
            className="max-w-xl text-body leading-body text-muted-foreground"
            variants={fadeInUp}
          >
            {greetingSummary}
          </motion.p>
        </motion.div>

        <motion.div className="relative z-10 mt-6 flex flex-wrap items-center gap-3" variants={{ staggerChildren: STAGGER.tight } as unknown as Variants}>
          <MotionLink
            href="/dashboard/subir"
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-6 py-3 text-body font-medium text-primary-foreground shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-primary-hover active:translate-y-0"
            variants={scaleInSpring}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
          >
            <Upload className="h-4 w-4" />
            Subir nuevo estudio
          </MotionLink>
          <MotionLink
            href="/dashboard/estudios"
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border-strong bg-surface px-5 py-3 text-body font-medium text-primary transition-colors duration-150 hover:bg-background"
            variants={scaleInSpring}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
          >
            <Document className="h-4 w-4" />
            Ver mis estudios
          </MotionLink>
        </motion.div>
      </motion.div>

      <MotionLink
        href="/dashboard/subir"
        className="group flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-surface p-6 text-center shadow-sm transition-all duration-150 hover:shadow-md lg:w-96"
        variants={fadeInUp}
        style={{ animationDelay: "100ms" }}
        whileHover={{ y: -2, boxShadow: "var(--shadow-md)", transition: { duration: 0.2 } }}
      >
        <motion.span
          aria-hidden="true"
          className="mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-muted text-primary transition-transform duration-200 group-hover:scale-105"
          whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
        >
          <Upload className="h-6 w-6" />
        </motion.span>
        <motion.span className="text-subheading text-primary" variants={fadeInUp}>
          Subí tu estudio
        </motion.span>
        <motion.span className="max-w-[240px] text-caption leading-body text-muted-foreground" variants={fadeInUp}>
          PDF o imagen de tu estudio médico, hasta {maxFileMB} MB.
        </motion.span>
        <motion.span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-caption text-muted-foreground" variants={fadeInUp}>
          <Shield aria-hidden="true" className="h-3.5 w-3.5" />
          Tus estudios son privados
        </motion.span>
      </MotionLink>
    </motion.section>
  );
}