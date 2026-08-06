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
import { crearActaFirmada, type EstadoAccion } from "../../actions";

const initialState: EstadoAccion = {};
const hoy = new Date().toISOString().slice(0, 10);

export function ActaForm({
  casoId,
  alumnoNombre,
  psicologoNombre,
}: {
  casoId: string;
  alumnoNombre: string;
  psicologoNombre: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(crearActaFirmada, initialState);

  const padPsicologo = useRef<SignaturePadHandle>(null);
  const padPadre = useRef<SignaturePadHandle>(null);
  const inputFirmaPsicologo = useRef<HTMLInputElement>(null);
  const inputFirmaPadre = useRef<HTMLInputElement>(null);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (padPsicologo.current?.isEmpty() || padPadre.current?.isEmpty()) {
          e.preventDefault();
          toast.error("Faltan firmas: ambas partes deben firmar en pantalla.");
          return;
        }
        if (inputFirmaPsicologo.current) inputFirmaPsicologo.current.value = padPsicologo.current!.toDataURL();
        if (inputFirmaPadre.current) inputFirmaPadre.current.value = padPadre.current!.toDataURL();
      }}
      className="rounded-xl border border-border bg-card shadow-sm"
    >
      <input type="hidden" name="caso_id" value={casoId} />
      <input type="hidden" name="firma_psicologo" ref={inputFirmaPsicologo} />
      <input type="hidden" name="firma_padre" ref={inputFirmaPadre} />

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
            <Input type="time" name="hora" defaultValue="15:00" required />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Psicólogo</Label>
          <Input value={psicologoNombre} disabled />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Asistentes</Label>
          <Input name="asistentes" required placeholder="Madre / padre / apoderado…" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Detalle de la reunión</Label>
          <Textarea name="detalle" required placeholder="Contexto y motivo de la reunión" />
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Observaciones del psicólogo</Label>
            <Textarea name="obs_psicologo" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Observaciones del padre de familia</Label>
            <Textarea name="obs_padre" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Acuerdos y compromisos del psicólogo</Label>
            <Textarea name="acuerdos_psicologo" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Compromisos del padre de familia</Label>
            <Textarea name="compromisos_padre" required />
          </div>
        </div>

        <fieldset className="rounded-lg border border-border p-4">
          <legend className="px-1.5 text-sm font-bold text-primary">Firmas en pantalla</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <SignaturePad ref={padPsicologo} label="Firma del psicólogo" />
              <Input name="firma_psicologo_nombre" required defaultValue={psicologoNombre} placeholder="Nombre de quien firma" />
            </div>
            <div className="flex flex-col gap-2">
              <SignaturePad ref={padPadre} label="Firma del padre / madre / apoderado" />
              <Input name="firma_padre_nombre" required placeholder="Nombre de quien firma" />
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Trazo simple en pantalla, sin certificado digital · se guarda con nombre y fecha/hora.
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
