"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect prefers-reduced-motion
 * Returns true when user prefers reduced motion
 * Respects system setting and updates on change
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    
    const handler = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return reducedMotion;
}

/**
 * Hook to get motion-safe values
 * Returns alternative values when reduced motion is preferred
 */
export function useMotionSafe<T>(normal: T, reduced: T): T {
  const reducedMotion = useReducedMotion();
  return reducedMotion ? reduced : normal;
}

/**
 * Get transition config that respects reduced motion
 */
export function getMotionSafeTransition(
  normalTransition: object,
  reducedTransition: object = { duration: 0.01 }
) {
  const reducedMotion = typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

  return reducedMotion ? reducedTransition : normalTransition;
}