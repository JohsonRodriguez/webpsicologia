import type { Rol } from "@/lib/roles";
import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  ListChecks,
  FolderOpen,
  Users,
  Bell,
  ShieldCheck,
  BarChart3,
  UserCog,
  GraduationCap,
  CalendarRange,
  Layers,
  RefreshCw,
  Settings,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };
export type NavGroup = { label: string; items: NavItem[] };

export function navFor(rol: Rol): NavGroup[] {
  const groups: NavGroup[] = [];

  if (rol === "profesor") {
    groups.push({
      label: "Incidencias",
      items: [
        { href: "/incidencias", label: "Mis incidencias", icon: ListChecks },
        { href: "/notificaciones", label: "Notificaciones", icon: Bell },
      ],
    });
  }

  if (rol === "psicologo" || rol === "jefe_psicologia") {
    groups.push({
      label: "Psicología",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
        { href: "/casos", label: "Mis casos e incidencias", icon: FolderOpen },
        { href: "/alumnos", label: "Alumnos de mi nivel", icon: Users },
        { href: "/notificaciones", label: "Notificaciones", icon: Bell },
      ],
    });
  }

  if (rol === "jefe_psicologia") {
    groups.push({
      label: "Jefatura",
      items: [
        { href: "/todas", label: "Todas las incidencias y casos", icon: ShieldCheck },
        { href: "/reportes", label: "Reportes y estadísticas", icon: BarChart3 },
      ],
    });
  }

  if (rol === "administrador") {
    groups.push({
      label: "Administración",
      items: [
        { href: "/admin", label: "Dashboard general", icon: LayoutGrid },
        { href: "/admin/usuarios", label: "Usuarios", icon: UserCog },
        { href: "/admin/alumnos", label: "Alumnos", icon: GraduationCap },
        { href: "/admin/anios", label: "Años académicos", icon: CalendarRange },
        { href: "/admin/grados", label: "Grados y secciones", icon: Layers },
        { href: "/admin/migracion", label: "Migración de grado", icon: RefreshCw },
        { href: "/admin/config", label: "Psicólogo por grado y catálogos", icon: Settings },
      ],
    });
  }

  return groups;
}
