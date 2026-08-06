"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { crearCasoDirecto, type EstadoAccion } from "../actions";

const initialState: EstadoAccion = {};

export function NuevoCasoForm({
  alumnos,
}: {
  alumnos: { id: string; nombres: string; apellidos: string; codigo: string }[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(crearCasoDirecto, initialState);

  return (
    <form action={formAction} className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1.5">
          <Label>Alumno</Label>
          <select required name="alumno" className="h-9 rounded-md border border-input bg-card px-3 text-sm">
            <option value="">Selecciona…</option>
            {alumnos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombres} {a.apellidos} — {a.codigo}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Motivo de apertura</Label>
          <Textarea required name="motivo" placeholder="¿Qué observaste que amerita seguimiento?" />
        </div>
        {state.error && (
          <p className="rounded-md bg-critical-soft px-3 py-2 text-sm text-critical">{state.error}</p>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-border p-4">
        <Button type="button" variant="outline" onClick={() => router.push("/casos")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Abrir caso
        </Button>
      </div>
    </form>
  );
}
