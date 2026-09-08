import type { ReactNode } from "react";
import { Home, Document, Upload, Compare, Chat, User } from "@/components/ui/icons";

export type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

/**
 * Ítems de navegación del dashboard. Fuente única compartida por la sidebar
 * de escritorio (DashboardNav) y el menú móvil (MobileNav), para evitar que
 * las dos listas diverjan.
 */
export const navItems: NavItem[] = [
  {
    label: "Inicio",
    href: "/dashboard",
    icon: <Home />,
  },
  {
    label: "Mis estudios",
    href: "/dashboard/estudios",
    icon: <Document />,
  },
  {
    label: "Subir estudio",
    href: "/dashboard/subir",
    icon: <Upload />,
  },
  {
    label: "Comparar",
    href: "/dashboard/comparar",
    icon: <Compare />,
  },
  {
    label: "Chat IA",
    href: "/dashboard/chat",
    icon: <Chat />,
  },
  {
    label: "Perfil",
    href: "/dashboard/perfil",
    icon: <User />,
  },
];

/**
 * Determina si una ruta está activa para un ítem de navegación.
 * El inicio coincide de forma exacta; el resto, por prefijo.
 */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}
