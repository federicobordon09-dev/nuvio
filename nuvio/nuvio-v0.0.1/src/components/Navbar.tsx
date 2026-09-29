"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

const NAV_LINKS = [
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#estudios", label: "Tipos de estudios" },
  { href: "#seguridad", label: "Seguridad" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-200 ${
        scrolled
          ? "border-border bg-surface/85 backdrop-blur-xl"
          : "on-dark border-white/10 bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="flex items-center" aria-label="Nuvio">
          <Image
            src="/nuvio_logo_nuevo.png"
            alt="Nuvio"
            width={120}
            height={32}
            className={`h-8 w-auto transition-opacity duration-200 ${
              scrolled ? "" : "brightness-0 invert"
            }`}
            priority
          />
        </Link>

        <nav aria-label="Navegación principal" className="hidden sm:block">
          <ul
            className={`flex items-center gap-8 text-caption font-medium transition-colors duration-200 ease-out ${
              scrolled ? "text-muted-foreground" : "text-white/75"
            }`}
          >
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <a
                  href={href}
                  className={`transition-colors duration-200 ease-out ${
                    scrolled ? "hover:text-foreground" : "hover:text-white"
                  }`}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <Link href="/auth/login">
          <Button size="sm" variant={scrolled ? "primary" : "secondary"}>
            Empezar
          </Button>
        </Link>
      </div>
    </header>
  );
}
