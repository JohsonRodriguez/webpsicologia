"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ejecutarMigracion } from "../actions";

export function MigracionForm({ destinos }: { destinos: { id: string; anio: number }[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
      action={(formData) => {
        const destino = String(formData.get("destino") ?? "");
        if (!destino) {
          toast.error("Selecciona un año destino.");
          return;
        }
        if (!confirm("¿Ejecutar la migración de grado? Esta acción crea matrículas nuevas y no se puede deshacer automáticamente.")) return;
        startTransition(async () => {
          const result = await ejecutarMigracion(destino);
          if (result?.error) toast.error(result.error);
          else toast.success(`Migración completa: ${result.creadas} alumnos promovidos${result.egresadas ? `, ${result.egresadas} egresados` : ""}`);
        });
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label>Año destino</Label>
        <select
          name="destino"
          disabled={!destinos.length}
          required
          className="h-9 rounded-md border border-input bg-card px-3 text-sm disabled:opacity-50"
        >
          {destinos.length ? (
            destinos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.anio}
              </option>
            ))
          ) : (
            <option value="">Crea primero un año nuevo</option>
          )}
        </select>
      </div>
      <Button type="submit" disabled={pending || !destinos.length}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
        Ejecutar migración
      </Button>
    </form>
  );
}
