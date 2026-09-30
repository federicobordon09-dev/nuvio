"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { fadeInUp, getViewportOptions, STAGGER } from "@/lib/animation";

const PLATFORM_LINKS = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#estudios", label: "Tipos de estudios" },
  { href: "#claridad", label: "Claridad sin ansiedad" },
  { href: "#seguridad", label: "Seguridad y privacidad" },
];

const ACCESS_LINKS = [
  { href: "/auth/login", label: "Ingresar o crear cuenta" },
  { href: "/dashboard", label: "Panel de estudios" },
];

const RESPONSIBILITY = [
  "Interpretación, no diagnóstico.",
  "Los resultados deben ser evaluados por un profesional de la salud.",
  "Consultá siempre con tu médico.",
];

function FooterLink({
  href,
  label,
  index,
}: {
  href: string;
  label: string;
  index: number;
}) {
  return (
    <motion.li
      key={href}
      variants={fadeInUp}
      style={{ animationDelay: `${index * STAGGER.tight * 1000}ms` }}
    >
      <Link
        href={href}
        className="text-caption text-muted-foreground transition-colors duration-200 hover:text-foreground"
      >
        {label}
      </Link>
    </motion.li>
  );
}

function ResponsibilityItem({
  item,
  index,
}: {
  item: string;
  index: number;
}) {
  return (
    <motion.li
      key={item}
      className="text-caption leading-body text-muted-foreground"
      variants={fadeInUp}
      style={{ animationDelay: `${index * STAGGER.tight * 1000}ms` }}
    >
      {item}
    </motion.li>
  );
}

export default function Footer() {
  return (
    <motion.footer
      className="border-t border-border bg-surface"
      initial="hidden"
      animate="visible"
      viewport={getViewportOptions()}
    >
      <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
<motion.div
          className="grid gap-10 md:grid-cols-12"
          // @ts-expect-error - inline variants object
          variants={{ staggerChildren: STAGGER.section }}
        >
        <motion.div
          className="md:col-span-5"
          // @ts-expect-error - fadeInUp is a valid Variants object
          variants={fadeInUp}
          style={{ animationDelay: "0ms" }}
        >
            <Link href="/" className="flex items-center gap-3" aria-label="Nuvio">
              <Image
                src="/nuvio_logo_nuevo.png"
                alt="Nuvio"
                width={100}
                height={28}
                className="h-7 w-auto"
              />
              <span className="text-subheading text-primary">Nuvio</span>
            </Link>
            <p className="mt-4 max-w-md text-caption leading-body text-muted-foreground">
              Información médica compleja, explicada de forma clara: subí tu
              estudio y entendé tus resultados sin jerga y sin alarmismos.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              <li className="rounded-full border border-border bg-background px-3 py-1 text-caption text-muted-foreground">
                PDF, JPG y PNG
              </li>
              <li className="rounded-full border border-border bg-background px-3 py-1 text-caption text-muted-foreground">
                Tus estudios, bajo tu control
              </li>
            </ul>
          </motion.div>

          <motion.nav
            aria-label="Plataforma"
            className="flex flex-col gap-3 md:col-span-3"
            // @ts-expect-error - fadeInUp is a valid Variants object
            variants={fadeInUp}
            style={{ animationDelay: "100ms" }}
          >
            <span className="text-caption font-medium uppercase tracking-caption text-primary">
              Plataforma
            </span>
            <motion.ul
              className="flex flex-col gap-2"
              variants={{ staggerChildren: STAGGER.tight }}
            >
              {PLATFORM_LINKS.map((link, index) => (
                <FooterLink key={link.href} {...link} index={index} />
              ))}
            </motion.ul>
          </motion.nav>

          <motion.nav
            aria-label="Acceso"
            className="flex flex-col gap-3 md:col-span-2"
            // @ts-expect-error - fadeInUp is a valid Variants object
            variants={fadeInUp}
            style={{ animationDelay: "200ms" }}
          >
            <span className="text-caption font-medium uppercase tracking-caption text-primary">
              Acceso
            </span>
            <motion.ul
              className="flex flex-col gap-2"
              variants={{ staggerChildren: STAGGER.tight }}
            >
              {ACCESS_LINKS.map((link, index) => (
                <FooterLink key={link.href} {...link} index={index} />
              ))}
            </motion.ul>
          </motion.nav>

          <motion.div
            className="flex flex-col gap-3 md:col-span-2"
            // @ts-expect-error - fadeInUp is a valid Variants object
            variants={fadeInUp}
            style={{ animationDelay: "300ms" }}
          >
            <span className="text-caption font-medium uppercase tracking-caption text-primary">
              Responsabilidad
            </span>
            <motion.ul
              className="flex flex-col gap-2"
              variants={{ staggerChildren: STAGGER.tight }}
            >
              {RESPONSIBILITY.map((item, index) => (
                <ResponsibilityItem key={item} item={item} index={index} />
              ))}
            </motion.ul>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-12 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"
          variants={fadeInUp}
          style={{ animationDelay: "400ms" }}
        >
          <p className="text-caption text-muted-foreground">
            Información médica compleja. Explicada de forma clara.
          </p>
          <p className="text-caption text-muted-foreground/70">
            &copy; {new Date().getFullYear()} Nuvio
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
}