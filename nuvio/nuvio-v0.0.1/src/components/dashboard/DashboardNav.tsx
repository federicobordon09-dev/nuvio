"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { navItems, isActivePath } from "./nav-items";
import { slideInRight, navLinkVariants } from "@/lib/animation";

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <motion.nav
      aria-label="Navegación del dashboard"
      className="flex flex-col gap-1"
      initial="hidden"
      animate="visible"
      variants={{ staggerChildren: 0.05 }}
    >
      {navItems.map((item, index) => {
        const active = isActivePath(pathname, item.href);
        return (
          <motion.li key={item.href} variants={slideInRight} style={{ animationDelay: `${index * 50}ms` }}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-body font-medium transition-all duration-150 ease-out ${
                active
                  ? "bg-primary-muted text-primary font-semibold shadow-sm"
                  : "text-muted-foreground hover:bg-primary-muted/40 hover:text-foreground"
              }`}
            >
              <motion.span
                className={`flex h-5 w-5 shrink-0 items-center justify-center ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
                variants={navLinkVariants}
              >
                {item.icon}
              </motion.span>
              {item.label}
            </Link>
          </motion.li>
        );
      })}
    </motion.nav>
  );
}