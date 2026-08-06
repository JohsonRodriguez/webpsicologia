"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { marcarNotificacionLeida } from "@/app/(app)/incidencias/actions";

export function NotificacionItem({
  id,
  texto,
  fecha,
  leido,
  href,
}: {
  id: string;
  texto: string;
  fecha: string;
  leido: boolean;
  href?: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function abrir() {
    if (!leido) startTransition(() => marcarNotificacionLeida(id));
    if (href) router.push(href);
  }

  return (
    <div
      role={href ? "link" : undefined}
      tabIndex={href ? 0 : undefined}
      onClick={href ? abrir : undefined}
      onKeyDown={href ? (e) => e.key === "Enter" && abrir() : undefined}
      className={cn(
        "flex items-start gap-3 border-b border-border px-5 py-3.5 last:border-0",
        href && "cursor-pointer hover:bg-secondary/60",
        !leido && "bg-accent/40",
      )}
    >
      <span
        className={cn("mt-1.5 size-1.5 flex-none rounded-full bg-primary", leido && "invisible")}
      />
      <div className="flex-1">
        <p className="text-sm">{texto}</p>
        <time className="text-xs text-muted-foreground">
          {new Date(fecha).toLocaleString("es-PE", { dateStyle: "long", timeStyle: "short" })}
        </time>
      </div>
      {!leido && !href && (
        <button
          disabled={pending}
          onClick={() => startTransition(() => marcarNotificacionLeida(id))}
          className="text-xs font-medium text-primary hover:underline"
        >
          Marcar leída
        </button>
      )}
    </div>
  );
}
