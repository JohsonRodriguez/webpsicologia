"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EstructuraAcademica } from "@/lib/queries";
import { crearCasoDirecto, type EstadoAccion } from "../actions";

type AlumnoOpcion = { alumnoId: string; seccionId: string; nombre: string; codigo: string };

const initialState: EstadoAccion = {};

export function NuevoCasoForm({
  estructura,
  alumnosPorSeccion,
}: {
  estructura: EstructuraAcademica;
  alumnosPorSeccion: AlumnoOpcion[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(crearCasoDirecto, initialState);

  const [nivelId, setNivelId] = useState("");
  const [gradoId, setGradoId] = useState("");
  const [seccionId, setSeccionId] = useState("");

  const grados = useMemo(
    () => estructura.grados.filter((g) => g.nivel_id === nivelId),
    [estructura.grados, nivelId],
  );
  const secciones = useMemo(
    () => estructura.secciones.filter((s) => s.grado_id === gradoId),
    [estructura.secciones, gradoId],
  );
  const alumnos = useMemo(
    () => alumnosPorSeccion.filter((a) => a.seccionId === seccionId),
    [alumnosPorSeccion, seccionId],
  );

  return (
    <form action={formAction} className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-5 p-5">
        <fieldset className="rounded-lg border border-border p-4">
          <legend className="px-1.5 text-sm font-bold text-primary">Alumno</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>Nivel</Label>
              <select
                required
                value={nivelId}
                onChange={(e) => {
                  setNivelId(e.target.value);
                  setGradoId("");
                  setSeccionId("");
                }}
                className="h-9 rounded-md border border-input bg-card px-3 text-sm"
              >
                <option value="">Selecciona…</option>
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
                onChange={(e) => {
                  setGradoId(e.target.value);
                  setSeccionId("");
                }}
                className="h-9 rounded-md border border-input bg-card px-3 text-sm disabled:opacity-50"
              >
                <option value="">{nivelId ? "Selecciona…" : "Primero elige nivel"}</option>
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
                value={seccionId}
                onChange={(e) => setSeccionId(e.target.value)}
                className="h-9 rounded-md border border-input bg-card px-3 text-sm disabled:opacity-50"
              >
                <option value="">{gradoId ? "Selecciona…" : "Primero elige grado"}</option>
                {secciones.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-3">
              <Label>Alumno</Label>
              <select
                required
                disabled={!seccionId}
                name="alumno"
                className="h-9 rounded-md border border-input bg-card px-3 text-sm disabled:opacity-50"
              >
                <option value="">{seccionId ? "Selecciona…" : "Primero elige sección"}</option>
                {alumnos.map((a) => (
                  <option key={a.alumnoId} value={a.alumnoId}>
                    {a.nombre} — {a.codigo}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

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
