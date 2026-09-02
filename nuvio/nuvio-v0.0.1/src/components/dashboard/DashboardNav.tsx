"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems, isActivePath } from "./nav-items";

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación del dashboard" className="flex flex-col gap-1">
      {navItems.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg py-2.5 text-[14px] font-medium transition-colors duration-150 ${
              active
                ? "border-l-2 border-ocean bg-ocean-tint pl-[11px] text-ocean-dark"
                : "pl-3 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <span className={active ? "text-ocean" : "text-muted-foreground"}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
