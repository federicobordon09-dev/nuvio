"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { navItems, isActivePath } from "./nav-items";
import { X, Menu, LogOut } from "@/components/ui/icons";

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
        className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-all duration-150 hover:bg-primary-muted/40 hover:text-foreground active:scale-[0.98]"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
      >
        {open ? <X /> : <Menu />}
      </button>

      <div
        className={`fixed inset-0 z-50 h-dvh lg:hidden ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
      >
        <div
          className={`absolute inset-0 bg-foreground/30 backdrop-blur-md transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={close}
        />

        <div
          ref={panelRef}
          id="mobile-nav-panel"
          className={`absolute inset-y-0 left-0 flex w-72 flex-col bg-surface shadow-xl transition-transform duration-200 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-subheading font-medium text-foreground">Nuvio</span>
            <button
              onClick={close}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary-muted/40 active:scale-[0.98]"
              aria-label="Cerrar menú"
            >
              <X />
            </button>
          </div>

          <div className="px-3">
            <div className="divider" />
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="flex flex-col gap-0.5">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-body font-medium transition-all duration-150 ease-out ${
                        active
                          ? "bg-primary-muted text-primary shadow-sm"
                          : "text-muted-foreground hover:bg-primary-muted/40 hover:text-foreground"
                      }`}
                    >
                      <span className={`flex h-5 w-5 items-center justify-center ${active ? "text-primary" : "text-muted-foreground"}`}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="px-3">
            <div className="divider" />
          </div>

          <div className="px-3 py-4">
            {userName && (
              <div className="mb-3 flex items-center gap-3 px-3">
                {userAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
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
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-body font-medium text-muted-foreground transition-all duration-150 hover:bg-primary-muted/40 hover:text-foreground active:scale-[0.98]"
              >
                <LogOut />
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
