"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, type Transition } from "motion/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Menu, X } from "@/components/ui/icons";
import {
  fadeInDown,
  slideInRight,
  mobileNavPanel,
  mobileNavOverlay,
  navLinkVariants,
  getMotionSafeTransition,
} from "@/lib/animation";

const NAV_LINKS = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#estudios", label: "Tipos de estudios" },
  { href: "#seguridad", label: "Seguridad" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 border-b"
      style={{
        backgroundColor: scrolled
          ? "rgba(250, 248, 252, 0.85)"
          : "transparent",
        borderColor: scrolled
          ? "rgba(37, 24, 54, 0.08)"
          : "rgba(255, 255, 255, 0.1)",
        backdropFilter: scrolled ? "blur(20px)" : "none",
      }}
      transition={getMotionSafeTransition({ duration: 0.3, ease: [0.16, 1, 0.3, 1] } as Transition)}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="flex items-center" aria-label="Nuvio">
          <motion.div
            transition={getMotionSafeTransition({
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1],
            } as Transition)}
            style={{
              filter: scrolled ? "brightness(1)" : "brightness(0) invert(1)",
            }}
          >
            <Image
              src="/nuvio_logo_nuevo.png"
              alt="Nuvio"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <motion.nav
          aria-label="Navegación principal"
          className="hidden sm:block"
          variants={fadeInDown}
          initial="hidden"
          animate="visible"
        >
          <motion.ul
            className="flex items-center gap-8 text-caption font-medium transition-colors duration-300"
            style={{
              color: scrolled
                ? "rgb(74, 69, 77)"
                : "rgba(255, 255, 255, 0.75)",
            }}
            variants={fadeInDown}
          >
            {NAV_LINKS.map(({ href, label }, index) => (
              <motion.li
                key={href}
                variants={navLinkVariants}
                style={{ animationDelay: `${index * 75}ms` }}
                whileHover={{ x: 4 }}
              >
                <a
                  href={href}
                  className="transition-colors duration-200 ease-out"
                  style={{
                    color: scrolled
                      ? "inherit"
                      : "rgba(255, 255, 255, 0.75)",
                  }}
                >
                  {label}
                </a>
              </motion.li>
            ))}
          </motion.ul>
        </motion.nav>

        <motion.div
          className="hidden sm:block"
          variants={fadeInDown}
          style={{ animationDelay: "300ms" }}
        >
          <Link href="/auth/login">
            <Button
              size="sm"
              variant={scrolled ? "primary" : "secondary"}
              className="transition-all duration-150"
            >
              Empezar
            </Button>
          </Link>
        </motion.div>

        {/* Mobile Menu Button */}
        <button
          className="sm:hidden flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-all duration-150 hover:bg-primary-muted/40 hover:text-foreground active:scale-[0.98]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-panel"
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Navigation Panel */}
      <motion.div
        className="fixed inset-0 z-50 h-dvh sm:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        variants={mobileNavOverlay}
        initial="closed"
        animate={mobileOpen ? "open" : "closed"}
        transition={getMotionSafeTransition({ duration: 0.2, ease: [0.16, 1, 0.3, 1] })}
      >
        <motion.div
          className="absolute inset-0 bg-foreground/30 backdrop-blur-md"
          variants={mobileNavOverlay}
          initial="closed"
          animate={mobileOpen ? "open" : "closed"}
          onClick={closeMobile}
        />

        <motion.div
          id="mobile-nav-panel"
          className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface shadow-xl"
          variants={mobileNavPanel}
          initial="closed"
          animate={mobileOpen ? "open" : "closed"}
transition={getMotionSafeTransition({ duration: 0.3, ease: [0.16, 1, 0.3, 1] } as Transition)}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-subheading text-primary">Nuvio</span>
            <button
              onClick={closeMobile}
              className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-primary-muted/40 active:scale-[0.98]"
              aria-label="Cerrar menú"
            >
              <X />
            </button>
          </div>

          <div className="px-3">
            <div className="divider" />
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map(({ href, label }, index) => (
                <motion.li
                  key={href}
                  variants={slideInRight}
                  style={{ animationDelay: `${index * 75}ms` }}
                >
                  <Link
                    href={href}
                    onClick={closeMobile}
                    className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-body font-medium text-muted-foreground transition-all duration-150 ease-out hover:bg-primary-muted/40 hover:text-foreground"
                  >
                    {label}
                  </Link>
                </motion.li>
              ))}
              <motion.li
                variants={slideInRight}
                style={{ animationDelay: `${NAV_LINKS.length * 75}ms` }}
              >
                <Link
                  href="/auth/login"
                  onClick={closeMobile}
                  className="flex min-h-11 items-center gap-3 rounded-md bg-primary px-3 py-2.5 text-body font-medium text-primary-foreground shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-primary-hover active:translate-y-0"
                >
                  Empezar
                </Link>
              </motion.li>
            </ul>
          </nav>
        </motion.div>
      </motion.div>
    </motion.header>
  );
}