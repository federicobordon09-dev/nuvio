"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems, isActivePath } from "./nav-items";

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación del dashboard" className="flex flex-col gap-0.5">
      {navItems.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
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
        );
      })}
    </nav>
  );
}
