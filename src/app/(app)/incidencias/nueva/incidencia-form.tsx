"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EstructuraAcademica } from "@/lib/queries";
import { SelectorPrioridad, EvidenciaDropzone } from "@/components/incidencia-campos";
import { crearIncidencia, type EstadoAccion } from "../actions";

type AlumnoOpcion = { alumnoId: string; seccionId: string; nombre: string; codigo: string };

const initialState: EstadoAccion = {};

export function IncidenciaForm({
  estructura,
  alumnosPorSeccion,
  motivos,
}: {
  estructura: EstructuraAcademica;
  alumnosPorSeccion: AlumnoOpcion[];
  motivos: { id: string; nombre: string }[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(crearIncidencia, initialState);

  const [nivelId, setNivelId] = useState("");
  const [gradoId, setGradoId] = useState("");
  const [seccionId, setSeccionId] = useState("");
  const [motivoId, setMotivoId] = useState("");

  const motivoEsOtro = useMemo(
    () => motivos.find((m) => m.id === motivoId)?.nombre === "Otro",
    [motivos, motivoId],
  );

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

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Motivo</Label>
            <select
              required
              name="motivo"
              value={motivoId}
              onChange={(e) => setMotivoId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="">Selecciona…</option>
              {motivos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
            {motivoEsOtro && (
              <Input
                required
                name="motivo_otro"
                placeholder="Especifica el motivo…"
                className="mt-1"
              />
            )}
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Nivel de prioridad</Label>
            <SelectorPrioridad />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Descripción</Label>
            <Textarea required name="descripcion" placeholder="Describe qué ocurrió…" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Acciones tomadas por el docente</Label>
            <Textarea required name="acciones" placeholder="¿Qué hiciste al momento del incidente?" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>
              Personas involucradas <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input name="involucrados" placeholder="Otros alumnos, personal, etc." />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>
              Evidencia adjunta <span className="font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <EvidenciaDropzone />
          </div>
        </div>

        {state.error && (
          <p className="rounded-md bg-critical-soft px-3 py-2 text-sm text-critical">{state.error}</p>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-border p-4">
        <Button type="button" variant="outline" onClick={() => router.push("/incidencias")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Enviar incidencia
        </Button>
      </div>
    </form>
  );
}
