"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Plus, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { EstructuraAcademica } from "@/lib/queries";
import { crearAlumno, type EstadoAccion } from "../actions";

const initialState: EstadoAccion = {};

export function NuevoAlumnoDialog({
  estructura,
  anioActivoId,
}: {
  estructura: EstructuraAcademica;
  anioActivoId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(crearAlumno, initialState);
  const [nivelId, setNivelId] = useState("");
  const [gradoId, setGradoId] = useState("");

  const grados = useMemo(() => estructura.grados.filter((g) => g.nivel_id === nivelId), [estructura.grados, nivelId]);
  const secciones = useMemo(() => estructura.secciones.filter((s) => s.grado_id === gradoId), [estructura.secciones, gradoId]);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            Alta manual
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo alumno</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3.5">
          <input type="hidden" name="anio" value={anioActivoId} />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Nombres</Label>
              <Input name="nombres" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Apellidos</Label>
              <Input name="apellidos" required />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Código</Label>
            <Input name="codigo" required placeholder="Ej. LB2099" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Nivel</Label>
              <select
                required
                value={nivelId}
                onChange={(e) => {
                  setNivelId(e.target.value);
                  setGradoId("");
                }}
                className="h-9 rounded-md border border-input bg-card px-2 text-sm"
              >
                <option value="">—</option>
                {estructura.niveles.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Grado</Label>
              <select
                required
                disabled={!nivelId}
                value={gradoId}
                name="grado"
                onChange={(e) => setGradoId(e.target.value)}
                className="h-9 rounded-md border border-input bg-card px-2 text-sm disabled:opacity-50"
              >
                <option value="">—</option>
                {grados.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Sección</Label>
              <select
                required
                disabled={!gradoId}
                name="seccion"
                className="h-9 rounded-md border border-input bg-card px-2 text-sm disabled:opacity-50"
              >
                <option value="">—</option>
                {secciones.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {state.error && <p className="rounded-md bg-critical-soft px-3 py-2 text-sm text-critical">{state.error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Crear alumno
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
