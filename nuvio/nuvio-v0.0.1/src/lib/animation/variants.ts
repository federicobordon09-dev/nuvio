"use client";

import { type Variants, type Transition } from "motion/react";

export type { Transition };

/**
 * Nuvio Animation System — Serene Clinical Editorial
 * Consistent motion tokens derived from DESIGN.md
 * Respects prefers-reduced-motion via CSS @media
 */

// ── Core Timing Tokens ────────────────────────────────────────────

export const DURATION = {
  instant: 0.05,
  fast: 0.15,
  base: 0.2,
  slow: 0.3,
  slower: 0.45,
  hero: 0.6,
} as const;

export const EASING = {
  standard: [0.16, 1, 0.3, 1] as const,
  easeOut: [0, 0.55, 0.45, 1] as const,
  easeIn: [0.55, 0, 1, 0.45] as const,
  sharp: [0.4, 0, 1, 1] as const,
  spring: { type: "spring", stiffness: 120, damping: 15 } as const,
  springSoft: { type: "spring", stiffness: 80, damping: 12 } as const,
  springBouncy: { type: "spring", stiffness: 180, damping: 12 } as const,
} as const;

// ── Stagger Tokens ────────────────────────────────────────────────

// Typed as Record<string, number> to be compatible with Variants['staggerChildren']
export const STAGGER: Record<string, number> = {
  tight: 0.04,
  base: 0.075,
  loose: 0.12,
  section: 0.15,
};

// ── Reusable Variants ─────────────────────────────────────────────

/** Fade in from opacity 0 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.base, ease: EASING.standard },
  },
};

/** Fade in up (most common entrance) */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASING.easeOut },
  },
};

/** Fade in up — slower, for hero */
export const fadeInUpHero: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.hero, ease: EASING.easeOut },
  },
};

/** Fade in down (for nav, dropdowns) */
export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASING.easeOut },
  },
};

/** Slide in from right */
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.slow, ease: EASING.easeOut },
  },
};

/** Slide in from left */
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.slow, ease: EASING.easeOut },
  },
};

/** Scale in (for cards, modals) */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION.base, ease: EASING.easeOut },
  },
};

/** Scale in with spring (for interactive elements) */
export const scaleInSpring: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: EASING.springSoft,
  },
};

/** Container stagger for children */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: STAGGER.base,
      delayChildren: 0.1,
    },
  },
};

/** Section reveal on scroll */
export const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slower, ease: EASING.easeOut },
  },
};

/** Section with staggered children */
export const sectionRevealStaggered: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: STAGGER.section,
      delayChildren: 0.1,
    },
  },
};

/** Card hover/tap variants */
export const cardInteractive = {
  rest: { scale: 1, y: 0, boxShadow: "var(--shadow-sm)" },
  hover: {
    y: -2,
    scale: 1.005,
    boxShadow: "var(--shadow-md)",
    transition: { duration: DURATION.fast, ease: EASING.easeOut },
  },
  tap: {
    y: 0,
    scale: 0.99,
    boxShadow: "var(--shadow-sm)",
    transition: { duration: DURATION.instant },
  },
} as const;

/** Button interactive variants */
export const buttonInteractive = {
  rest: { scale: 1 },
  hover: {
    scale: 1.01,
    transition: { duration: DURATION.fast, ease: EASING.easeOut },
  },
  tap: {
    scale: 0.98,
    transition: { duration: DURATION.instant },
  },
} as const;

/** Badge/pill interactive variants */
export const badgeInteractive = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: { duration: DURATION.fast, ease: EASING.easeOut },
  },
  tap: {
    scale: 0.95,
    transition: { duration: DURATION.instant },
  },
} as const;

/** Input focus variants */
export const inputFocus = {
  rest: { scale: 1, borderColor: "var(--color-border-strong)" },
  focus: {
    scale: 1.005,
    borderColor: "var(--color-lilac-glow)",
    boxShadow: "0 0 0 3px rgba(192, 132, 252, 0.2)",
    transition: { duration: DURATION.fast, ease: EASING.easeOut },
  },
} as const;

/** Nav link variants */
export const navLinkVariants: Variants = {
  rest: { opacity: 1, x: 0 },
  hover: {
    x: 4,
    transition: { duration: DURATION.fast, ease: EASING.easeOut },
  },
};

/** Mobile nav panel variants */
export const mobileNavPanel: Variants = {
  closed: { x: "100%", opacity: 0 },
  open: {
    x: 0,
    opacity: 1,
    transition: { duration: DURATION.slow, ease: EASING.easeOut },
  },
};

/** Mobile nav overlay variants */
export const mobileNavOverlay: Variants = {
  closed: { opacity: 0 },
  open: {
    opacity: 1,
    transition: { duration: DURATION.base, ease: EASING.easeOut },
  },
};

/** Floating element (glow, decoration) */
export const float: Variants = {
  animate: {
    y: [-6, 6, -6],
    transition: {
      duration: 6,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "loop",
    },
  },
};

/** Pulse subtle (status dots) */
export const pulseSubtle: Variants = {
  animate: {
    opacity: [1, 0.7, 1],
    transition: {
      duration: 2,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "loop",
    },
  },
};

/** Scale pulse (for icons, buttons) */
export const pulseScale: Variants = {
  animate: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 3,
      ease: "easeInOut",
      repeat: Infinity,
      repeatType: "loop",
    },
  },
};

/** Page transition (for layout animations) */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASING.easeOut },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: DURATION.fast, ease: EASING.easeIn },
  },
};

// ── Helper Functions ──────────────────────────────────────────────

/** Create a staggered delay based on index */
export function getStaggerDelay(index: number, baseDelay = 0, stagger = STAGGER.base): number {
  return baseDelay + index * stagger;
}

/** Create viewport options for whileInView */
export function getViewportOptions(once = true, margin = "0px 0px -50px 0px") {
  return {
    once,
    margin,
  };
}

/** Reduced motion detection hook result type */
export type ReducedMotionResult = boolean;