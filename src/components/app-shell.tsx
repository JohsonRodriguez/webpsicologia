"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Bell, Menu, X } from "lucide-react";
import { navFor } from "@/lib/nav";
import type { UsuarioActual } from "@/lib/auth";
import { type Rol, rolLabel } from "@/lib/roles";
import { CerrarSesionButton } from "@/components/cerrar-sesion-button";
import { cn } from "@/lib/utils";

function initials(nombre: string) {
  return nombre
    .split(" ")
    .filter((w) => w.length > 1)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function AppShell({
  usuario,
  unreadCount,
  children,
}: {
  usuario: UsuarioActual;
  unreadCount: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const groups = navFor(usuario.rol as Rol);

  return (
    <div className="grid min-h-screen md:grid-cols-[232px_1fr]">
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/35 opacity-0 transition-opacity duration-200 ease-(--ease-out) md:hidden",
          open ? "opacity-100" : "pointer-events-none",
        )}
        onClick={() => setOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[232px] -translate-x-full flex-col gap-1 overflow-y-auto border-r border-sidebar-border bg-sidebar p-3.5 transition-transform duration-200 ease-(--ease-drawer) md:static md:translate-x-0",
          open && "translate-x-0",
        )}
      >
        <div className="flex items-center gap-2.5 px-2 pb-4 pt-1">
          <Image src="/insignia.png" alt="" width={68} height={70} className="size-8.5 flex-none object-contain" />

          <div className="leading-tight">
            <p className="font-heading text-sm font-semibold text-sidebar-foreground">Departamento Psicopedagógico</p>
            <p className="text-[11px] text-sidebar-foreground/60">Colegio Lord Byron</p>
          </div>
        </div>

        {groups.map((group) => (
          <div key={group.label} className="mt-3.5">
            <p className="px-2.5 pb-1.5 text-[11px] font-semibold tracking-wide text-sidebar-foreground/50 uppercase">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors duration-150 ease-(--ease-out) hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    active && "bg-sidebar-accent text-sidebar-foreground",
                  )}
                >
                  <item.icon className="size-4.25 flex-none" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}

        <div className="mt-auto border-t border-sidebar-border pt-3">
          <div className="flex items-center gap-2.5 px-1 pb-2.5">
            <div className="flex size-7.5 flex-none items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-foreground">
              {initials(usuario.nombre)}
            </div>
            <div className="leading-tight">
              <p className="text-[13px] font-semibold text-sidebar-foreground">{usuario.nombre}</p>
              <p className="text-[11px] text-sidebar-foreground/60">{rolLabel(usuario.rol as Rol)}</p>
            </div>
          </div>
          <CerrarSesionButton
            variant="ghost"
            className="w-full justify-start px-2.5 text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-background/90 px-6 py-3 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <button
              className="flex size-9 items-center justify-center rounded-lg border border-border bg-card transition-colors duration-150 ease-(--ease-out) hover:bg-muted active:scale-[0.97] md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Abrir menú"
            >
              {open ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
            </button>
            <span className="text-[11px] font-semibold tracking-wide text-primary uppercase">
              {rolLabel(usuario.rol as Rol)}
            </span>
          </div>
          <Link
            href="/notificaciones"
            className="relative flex size-9 items-center justify-center rounded-lg border border-border bg-card transition-colors duration-150 ease-(--ease-out) hover:bg-muted active:scale-[0.97]"
          >
            <Bell className="size-4.25" />
            {unreadCount > 0 && (
              <span
                data-chart-anim
                className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full border-2 border-background bg-critical px-1 text-[10px] font-bold text-white"
                style={{ animation: "chart-pop 280ms var(--ease-out) both" }}
              >
                {unreadCount}
              </span>
            )}
          </Link>
        </header>

        <main className="flex-1 px-6 py-6 md:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
