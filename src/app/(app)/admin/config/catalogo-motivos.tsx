"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { crearMotivo, alternarMotivo } from "../actions";

type Motivo = { id: string; nombre: string; activo: boolean };

export function CatalogoMotivos({ motivos }: { motivos: Motivo[] }) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4">
          <h3 className="font-heading text-base font-semibold">Motivos de incidencia</h3>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap gap-2">
            {motivos.map((m) => (
              <button
                key={m.id}
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await alternarMotivo(m.id, !m.activo);
                    if (result?.error) toast.error(result.error);
                  })
                }
                className={
                  m.activo
                    ? "inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground hover:bg-critical-soft hover:text-critical"
                    : "inline-flex items-center rounded-full border border-dashed border-border px-2.5 py-1 text-xs font-bold text-muted-foreground/50 line-through hover:bg-good-soft hover:text-good"
                }
                title={m.activo ? "Clic para desactivar" : "Clic para reactivar"}
              >
                {m.nombre}
              </button>
            ))}
          </div>
          <form
            ref={formRef}
            className="flex gap-2"
            action={(formData) => {
              const nombre = String(formData.get("nombre") ?? "");
              startTransition(async () => {
                const result = await crearMotivo(nombre);
                if (result?.error) toast.error(result.error);
                else formRef.current?.reset();
              });
            }}
          >
            <Input name="nombre" placeholder="Nuevo motivo…" className="h-8 text-sm" />
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            </Button>
          </form>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4">
          <h3 className="font-heading text-base font-semibold">Niveles de prioridad</h3>
        </div>
        <div className="flex flex-wrap gap-2 p-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-good px-2.5 py-1 text-xs font-bold text-white">
            <span className="size-1.5 rounded-full bg-current" />
            Baja
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warn px-2.5 py-1 text-xs font-bold text-white">
            <span className="size-1.5 rounded-full bg-current" />
            Media
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-critical px-2.5 py-1 text-xs font-bold text-white">
            <span className="size-1.5 rounded-full bg-current" />
            Alta
          </span>
        </div>
        <p className="px-4 pb-4 text-xs text-muted-foreground">
          Fijos por diseño del sistema — no requieren mantenimiento.
        </p>
      </div>
    </div>
  );
}
