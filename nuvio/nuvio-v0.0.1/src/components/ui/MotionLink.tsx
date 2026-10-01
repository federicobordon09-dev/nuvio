"use client";

import Link from "next/link";
import { motion } from "motion/react";

/**
 * Animated link that preserves Next.js client-side navigation.
 *
 * `forwardMotionProps: true` lets motion-specific props (whileHover, whileTap,
 * variants, transition...) pass through to the wrapped component instead of
 * being stripped.
 */
export const MotionLink = motion.create(Link, { forwardMotionProps: true });
