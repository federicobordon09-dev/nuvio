"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

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
          ? "border-ink-700/10 bg-white/80 backdrop-blur-xl"
          : "border-transparent bg-white"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="flex items-center" aria-label="Nuvio">
          <Image
            src="/nuvio_logo.png"
            alt="Nuvio"
            width={120}
            height={32}
            className="h-8 w-auto"
            priority
          />
        </Link>

        <nav aria-label="Navegación principal" className="hidden sm:block">
          <ul className="flex items-center gap-8 text-[13px] font-medium text-muted-foreground">
            <li>
              <a
                href="#como-funciona"
                className="transition-colors duration-200 ease-out hover:text-foreground"
              >
                Cómo funciona
              </a>
            </li>
            <li>
              <a
                href="#seguridad"
                className="transition-colors duration-200 ease-out hover:text-foreground"
              >
                Seguridad
              </a>
            </li>
          </ul>
        </nav>

        <a
          href="#"
          className="inline-flex h-9 items-center rounded-lg bg-ink-950 px-4 text-[13px] font-medium text-white transition-all duration-200 ease-out hover:bg-ink-900 hover:shadow-[0_2px_8px_rgba(11,20,38,0.15)] active:scale-[0.98]"
        >
          Empezar
        </a>
      </div>
    </header>
  );
}
