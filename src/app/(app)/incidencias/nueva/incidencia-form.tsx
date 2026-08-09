"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SimpleSelect } from "@/components/simple-select";
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

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Motivo</Label>
            <SimpleSelect
              required
              name="motivo"
              value={motivoId}
              onValueChange={setMotivoId}
              placeholder="Selecciona…"
              options={motivos.map((m) => ({ value: m.id, label: m.nombre }))}
            />
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
