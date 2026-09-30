"use client";

import { motion } from "motion/react";
import {
  sectionRevealStaggered,
  fadeInUp,
  getViewportOptions,
  STAGGER,
} from "@/lib/animation";

const HIGHLIGHTS = [
  {
    title: "PDF e imágenes",
    description: "Subís el archivo tal como lo recibiste.",
  },
  {
    title: "Lenguaje claro",
    description: "Sin siglas médicas sin explicar.",
  },
  {
    title: "En tus manos",
    description: "Podés eliminar tus estudios cuando quieras.",
  },
  {
    title: "Orientación clara",
    description: "No reemplaza la consulta con tu médico.",
  },
];

export default function TrustBand() {
  return (
    <motion.section
      aria-label="En qué se basa Nuvio"
      className="border-b border-border bg-surface"
      variants={sectionRevealStaggered}
      initial="hidden"
      animate="visible"
      viewport={getViewportOptions()}
    >
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        <motion.ul
          className="grid grid-cols-2 gap-6 md:grid-cols-4"
          variants={sectionRevealStaggered}
        >
          {HIGHLIGHTS.map(({ title, description }, index) => (
            <motion.li
              key={title}
              className="flex flex-col gap-1"
              variants={fadeInUp}
              style={{ animationDelay: `${index * STAGGER.section * 1000}ms` }}
            >
              <span className="text-subheading text-primary">{title}</span>
              <span className="text-caption leading-body text-muted-foreground">
                {description}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </motion.section>
  );
}