"use client";

import { motion, AnimatePresence } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { navItems, isActivePath } from "./nav-items";
import { X, Menu, LogOut } from "@/components/ui/icons";
import { mobileNavPanel, mobileNavOverlay, slideInRight, getMotionSafeTransition } from "@/lib/animation";

interface MobileNavProps {
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

export function MobileNav({ userName, userEmail, userAvatar }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  useEffect(() => {
    if (!open || !panelRef.current) return;

    function handleTab(e: KeyboardEvent) {
      if (e.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleTab);
    const firstFocusable = panelRef.current.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();

    return () => document.removeEventListener("keydown", handleTab);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={toggleRef}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-all duration-150 hover:bg-primary-muted/40 hover:text-foreground active:scale-[0.98]"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {open ? <X /> : <Menu />}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 h-dvh lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileNavOverlay}
            transition={getMotionSafeTransition({ duration: 0.2, ease: [0.16, 1, 0.3, 1] })}
          >
            <motion.div
              className="absolute inset-0 bg-foreground/30 backdrop-blur-md"
              variants={mobileNavOverlay}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={close}
            />

            <motion.div
              ref={panelRef}
              id="mobile-nav-panel"
              className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface shadow-xl"
              variants={mobileNavPanel}
              initial="closed"
              animate="open"
              exit="closed"
              transition={getMotionSafeTransition({ duration: 0.3, ease: [0.16, 1, 0.3, 1] })}
            >
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-subheading text-primary">Nuvio</span>
                <button
                  onClick={close}
                  className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-primary-muted/40 active:scale-[0.98]"
                  aria-label="Cerrar menú"
                  whileTap={{ scale: 0.95 }}
                >
                  <X />
                </button>
              </div>

              <div className="px-3">
                <div className="divider" />
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4">
                <motion.ul
                  className="flex flex-col gap-1"
                  initial="hidden"
                  animate="visible"
                  variants={{ staggerChildren: 0.05 }}
                >
                  {navItems.map((item, index) => {
                    const active = isActivePath(pathname, item.href);
                    return (
                      <motion.li
                        key={item.href}
                        variants={slideInRight}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <Link
                          href={item.href}
                          onClick={close}
                          aria-current={active ? "page" : undefined}
                          className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-body font-medium transition-all duration-150 ease-out ${
                            active
                              ? "bg-primary-muted text-primary font-semibold shadow-sm"
                              : "text-muted-foreground hover:bg-primary-muted/40 hover:text-foreground"
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center ${
                              active ? "text-primary" : "text-muted-foreground"
                            }`}
                          >
                            {item.icon}
                          </span>
                          {item.label}
                        </Link>
                      </motion.li>
                    );
                  })}
                  <motion.li
                    variants={slideInRight}
                    style={{ animationDelay: `${navItems.length * 50}ms` }}
                  >
                    <Link
                      href="/dashboard/subir"
                      onClick={close}
                      className="flex min-h-11 items-center gap-3 rounded-md bg-primary px-3 py-2.5 text-body font-medium text-primary-foreground shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-primary-hover active:translate-y-0"
                    >
                      <span className="flex h-5 w-5 items-center justify-center">
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </span>
                      Subir estudio
                    </Link>
                  </motion.li>
                  <motion.li
                    variants={slideInRight}
                    style={{ animationDelay: `${(navItems.length + 1) * 50}ms` }}
                  >
                    <form action={signOut}>
                      <button
                        type="submit"
                        className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2.5 text-body font-medium text-muted-foreground transition-all duration-150 hover:bg-primary-muted/40 hover:text-foreground active:scale-[0.98]"
                      >
                        <LogOut />
                        Cerrar sesión
                      </button>
                    </form>
                  </motion.li>
                </motion.ul>
              </nav>

              <div className="px-3">
                <div className="divider" />
              </div>

              <motion.div
                className="px-3 py-4"
                initial="hidden"
                animate="visible"
                variants={slideInRight}
                style={{ animationDelay: `${(navItems.length + 2) * 50}ms` }}
              >
                {userName && (
                  <div className="mb-3 flex items-center gap-3 px-3">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt=""
                        className="h-9 w-9 rounded-full"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-muted text-caption font-medium text-primary">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-foreground truncate">{userName}</p>
                      {userEmail && (
                        <p className="text-caption text-muted-foreground truncate">{userEmail}</p>
                      )}
                    </div>
                  </div>
                )}
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2.5 text-body font-medium text-muted-foreground transition-all duration-150 hover:bg-primary-muted/40 hover:text-foreground active:scale-[0.98]"
                  >
                    <LogOut />
                    Cerrar sesión
                  </button>
                </form>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}