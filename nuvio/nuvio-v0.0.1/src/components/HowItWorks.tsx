"use client";

import { motion } from "motion/react";
import { Upload, Sparkles, CheckCircle, Document, Chat } from "@/components/ui/icons";
import {
  sectionRevealStaggered,
  fadeInUp,
  getViewportOptions,
  STAGGER,
} from "@/lib/animation";

const EYEBROW_CLASS =
  "text-caption font-medium uppercase tracking-caption text-violet";

const STEPS = [
  {
    step: "01",
    title: "Subís tu documento",
    description:
      "Elegí el archivo PDF o la foto de tu estudio médico. Nuvio lo recibe y valida de forma segura.",
    icon: <Upload className="h-5 w-5" />,
    footer: (
      <div className="flex items-center gap-3">
        <Document className="h-5 w-5 shrink-0 text-violet" />
        <div>
          <span className="block text-caption font-medium text-primary">
            Compatible con lo que ya tenés
          </span>
          <span className="block text-caption text-muted-foreground">
            PDF, JPG o PNG
          </span>
        </div>
      </div>
    ),
  },
  {
    step: "02",
    title: "Nuvio analiza la información",
    description:
      "La IA procesa el contenido del documento y extrae los datos relevantes de tu estudio.",
    icon: <Sparkles className="h-5 w-5" />,
    footer: (
      <div>
        <div className="mb-1.5 flex items-center justify-between text-caption text-muted-foreground">
          <span>Rango de referencia</span>
          <span className="font-medium text-warning-strong">
            Elevado leve
          </span>
        </div>
        <div
          className="flex h-2 w-full overflow-hidden rounded-full bg-surface-container-highest"
          aria-hidden="true"
        >
          <motion.div
            className="h-full bg-success/50"
            initial={{ width: 0 }}
            animate={{ width: "66.66%" }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.div
            className="h-full bg-warning"
            initial={{ width: 0 }}
            animate={{ width: "33.33%" }}
            transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
    ),
  },
  {
    step: "03",
    title: "Recibís una explicación clara",
    description:
      "Entendé tus resultados, los valores importantes y qué preguntarle a tu médico.",
    icon: <CheckCircle className="h-5 w-5" />,
    footer: (
      <div className="flex items-center gap-3">
        <Chat className="h-5 w-5 shrink-0 text-success" />
        <div>
          <span className="block text-caption font-medium text-primary">
            Listo para tu consulta
          </span>
          <span className="block text-caption text-muted-foreground">
            Resumen y preguntas sugeridas
          </span>
        </div>
      </div>
    ),
  },
];

function Step({
  step,
  title,
  description,
  icon,
  footer,
  index,
}: {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  footer: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div
      className="relative flex flex-col justify-between rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow-sm)] transition-all duration-200 ease-out hover:border-border/80 hover:shadow-[var(--shadow-md)]"
      variants={fadeInUp}
      style={{ animationDelay: `${index * STAGGER.section * 1000}ms` }}
      whileHover={{ y: -4, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
    >
      <div>
        <div className="mb-6 flex items-center justify-between">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-muted font-heading text-body font-bold text-primary">
            {step}
          </span>
          <span className="text-plum-muted">{icon}</span>
        </div>
        <h3 className="text-subheading text-primary">{title}</h3>
        <p className="mt-2 text-body leading-body text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="mt-6 rounded-lg bg-background p-4">{footer}</div>
    </motion.div>
  );
}

export default function HowItWorks() {
  return (
    <motion.section
      id="como-funciona"
      className="bg-background"
      aria-labelledby="como-funciona-heading"
      variants={sectionRevealStaggered}
      initial="hidden"
      animate="visible"
      viewport={getViewportOptions()}
    >
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28 lg:px-8">
        <motion.div
          className="flex flex-col justify-between gap-6 md:flex-row md:items-end"
          variants={fadeInUp}
        >
          <motion.div variants={fadeInUp} style={{ animationDelay: "0ms" }}>
            <p className={EYEBROW_CLASS}>Proceso simple y humano</p>
            <h2
              id="como-funciona-heading"
              className="mt-3 text-title-lg text-primary"
            >
              Cómo funciona Nuvio en 3 pasos
            </h2>
          </motion.div>
          <motion.p
            className="max-w-md text-body leading-body text-muted-foreground"
            variants={fadeInUp}
            style={{ animationDelay: "100ms" }}
          >
            Tres pasos simples, desde el archivo que ya tenés hasta una
            conversación más clara con tu médico.
          </motion.p>
        </motion.div>

        <motion.div
          className="mt-14 grid gap-6 sm:grid-cols-3"
          variants={sectionRevealStaggered}
        >
          {STEPS.map((step, index) => (
            <Step key={step.step} {...step} index={index} />
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}