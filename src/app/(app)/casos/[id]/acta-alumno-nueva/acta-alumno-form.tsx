"use client";

import { useActionState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SignaturePad, type SignaturePadHandle } from "@/components/signature-pad";
import { crearActaAlumno, type EstadoAccion } from "../../actions";

const initialState: EstadoAccion = {};
const hoy = new Date().toISOString().slice(0, 10);

export function ActaAlumnoForm({
  casoId,
  alumnoNombre,
  psicologoNombre,
}: {
  casoId: string;
  alumnoNombre: string;
  psicologoNombre: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(crearActaAlumno, initialState);

  const padAlumno = useRef<SignaturePadHandle>(null);
  const inputFirmaAlumno = useRef<HTMLInputElement>(null);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (padAlumno.current?.isEmpty()) {
          e.preventDefault();
          toast.error("Falta la firma del alumno.");
          return;
        }
        if (inputFirmaAlumno.current) inputFirmaAlumno.current.value = padAlumno.current!.toDataURL();
      }}
      className="rounded-xl border border-border bg-card shadow-sm"
    >
      <input type="hidden" name="caso_id" value={casoId} />
      <input type="hidden" name="firma_alumno" ref={inputFirmaAlumno} />

      <div className="flex flex-col gap-5 p-5">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label>Alumno</Label>
            <Input value={alumnoNombre} disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Fecha</Label>
            <Input type="date" name="fecha" defaultValue={hoy} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Hora</Label>
            <Input type="time" name="hora" defaultValue="10:00" required />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Psicólogo</Label>
          <Input value={psicologoNombre} disabled />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Motivo de la sesión</Label>
          <Textarea name="detalle" required placeholder="¿Sobre qué trató la sesión?" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Observaciones del psicólogo</Label>
          <Textarea name="observaciones" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Acuerdos y compromisos del alumno</Label>
          <Textarea name="acuerdos" required />
        </div>

        <fieldset className="rounded-lg border border-border p-4">
          <legend className="px-1.5 text-sm font-bold text-primary">Firma del alumno</legend>
          <div className="mx-auto flex max-w-sm flex-col gap-2">
            <SignaturePad ref={padAlumno} label="Firma del alumno" />
            <Input name="firma_alumno_nombre" required placeholder="Nombre de quien firma" />
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Trazo simple en pantalla, sin certificado digital · se guarda con nombre y fecha/hora. A diferencia del
            acta de reunión con padres, aquí solo firma el alumno.
          </p>
        </fieldset>

        {state.error && (
          <p className="rounded-md bg-critical-soft px-3 py-2 text-sm text-critical">{state.error}</p>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-border p-4">
        <Button type="button" variant="outline" onClick={() => router.push(`/casos/${casoId}`)}>
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
