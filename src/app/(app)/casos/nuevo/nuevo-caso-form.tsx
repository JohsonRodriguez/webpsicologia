"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SimpleSelect } from "@/components/simple-select";
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
              <SimpleSelect
                required
                value={nivelId}
                onValueChange={(v) => {
                  setNivelId(v);
                  setGradoId("");
                  setSeccionId("");
                }}
                placeholder="Selecciona…"
                options={estructura.niveles.map((n) => ({ value: n.id, label: n.nombre }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Grado</Label>
              <SimpleSelect
                required
                disabled={!nivelId}
                value={gradoId}
                onValueChange={(v) => {
                  setGradoId(v);
                  setSeccionId("");
                }}
                placeholder={nivelId ? "Selecciona…" : "Primero elige nivel"}
                options={grados.map((g) => ({ value: g.id, label: g.nombre }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Sección</Label>
              <SimpleSelect
                required
                disabled={!gradoId}
                value={seccionId}
                onValueChange={setSeccionId}
                placeholder={gradoId ? "Selecciona…" : "Primero elige grado"}
                options={secciones.map((s) => ({ value: s.id, label: s.nombre }))}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-3">
              <Label>Alumno</Label>
              <SimpleSelect
                key={seccionId}
                required
                disabled={!seccionId}
                name="alumno"
                placeholder={seccionId ? "Selecciona…" : "Primero elige sección"}
                options={alumnos.map((a) => ({ value: a.alumnoId, label: `${a.nombre} — ${a.codigo}` }))}
              />
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
