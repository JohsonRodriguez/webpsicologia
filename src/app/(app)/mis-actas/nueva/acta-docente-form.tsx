"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SimpleSelect } from "@/components/simple-select";
import { SignaturePad, type SignaturePadHandle } from "@/components/signature-pad";
import type { EstructuraAcademica } from "@/lib/queries";
import { crearActaDocente, type EstadoAccion } from "../actions";

type AlumnoOpcion = { alumnoId: string; seccionId: string; nombre: string; codigo: string };

const initialState: EstadoAccion = {};
const hoy = new Date().toISOString().slice(0, 10);
const OPCIONES_ASISTENTES = ["Madre de familia", "Padre de familia", "Apoderado", "Padre y madre"].map((v) => ({
  value: v,
  label: v,
}));

export function ActaDocenteForm({
  estructura,
  alumnosPorSeccion,
  tieneFirmaGuardada,
}: {
  estructura: EstructuraAcademica;
  alumnosPorSeccion: AlumnoOpcion[];
  tieneFirmaGuardada: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(crearActaDocente, initialState);

  const [nivelId, setNivelId] = useState("");
  const [gradoId, setGradoId] = useState("");
  const [seccionId, setSeccionId] = useState("");

  const grados = useMemo(() => estructura.grados.filter((g) => g.nivel_id === nivelId), [estructura.grados, nivelId]);
  const secciones = useMemo(() => estructura.secciones.filter((s) => s.grado_id === gradoId), [estructura.secciones, gradoId]);
  const alumnos = useMemo(() => alumnosPorSeccion.filter((a) => a.seccionId === seccionId), [alumnosPorSeccion, seccionId]);

  const padPadre = useRef<SignaturePadHandle>(null);
  const inputFirmaPadre = useRef<HTMLInputElement>(null);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (padPadre.current?.isEmpty()) {
          e.preventDefault();
          toast.error("Falta la firma del padre / madre / apoderado.");
          return;
        }
        if (inputFirmaPadre.current) inputFirmaPadre.current.value = padPadre.current!.toDataURL();
      }}
      className="rounded-xl border border-border bg-card shadow-sm"
    >
      <input type="hidden" name="firma_padre" ref={inputFirmaPadre} />

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
          <div className="flex flex-col gap-1.5">
            <Label>Fecha</Label>
            <Input type="date" name="fecha" defaultValue={hoy} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Hora</Label>
            <Input type="time" name="hora" defaultValue="15:00" required />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Asistentes</Label>
          <SimpleSelect required name="asistentes" placeholder="Selecciona…" options={OPCIONES_ASISTENTES} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Detalle de la reunión</Label>
          <Textarea name="detalle" required placeholder="Contexto y motivo de la reunión" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Acuerdos y compromisos del docente</Label>
          <Textarea name="acuerdos_docente" required className="min-h-28 w-full" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Compromisos del padre de familia</Label>
          <Textarea name="compromisos_padre" required className="min-h-28 w-full" />
        </div>

        <fieldset className="rounded-lg border border-border p-4">
          <legend className="px-1.5 text-sm font-bold text-primary">Firma en pantalla</legend>
          <div className="mx-auto flex max-w-sm flex-col gap-2">
            <SignaturePad ref={padPadre} label="Firma del padre / madre / apoderado" />
            <Input name="firma_padre_nombre" required placeholder="Nombre de quien firma" />
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Trazo simple en pantalla, sin certificado digital · se guarda con nombre y fecha/hora.
          </p>
          <div className="mt-3 flex items-start gap-2 rounded-md bg-info-soft px-3 py-2 text-xs text-info">
            <Info className="mt-0.5 size-3.5 flex-none" />
            {tieneFirmaGuardada ? (
              <span>Tu firma guardada se usará automáticamente para ti.</span>
            ) : (
              <span>
                No tienes una firma guardada: en el PDF aparecerá tu nombre sin imagen de firma. Puedes guardar una
                en{" "}
                <Link href="/mi-firma" className="font-semibold underline">
                  Mi firma
                </Link>
                .
              </span>
            )}
          </div>
        </fieldset>

        {state.error && (
          <p className="rounded-md bg-critical-soft px-3 py-2 text-sm text-critical">{state.error}</p>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-border p-4">
        <Button type="button" variant="outline" onClick={() => router.push("/mis-actas")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Guardar acta firmada
        </Button>
      </div>
    </form>
  );
}
