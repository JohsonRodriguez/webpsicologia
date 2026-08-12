"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SimpleSelect } from "@/components/simple-select";
import { SignaturePad, type SignaturePadHandle } from "@/components/signature-pad";
import { PERIODOS } from "@/lib/periodos";
import { crearReunionBienestar, type EstadoAccion } from "../actions";

const initialState: EstadoAccion = {};
const OPCIONES_MODALIDAD = [
  { value: "presencial", label: "Presencial" },
  { value: "virtual", label: "Virtual" },
];

export function ReunionBienestarForm({
  alumnoId,
  anioAcademicoId,
  periodoInicial,
}: {
  alumnoId: string;
  anioAcademicoId: string;
  periodoInicial: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(crearReunionBienestar, initialState);
  const [modalidad, setModalidad] = useState("");

  const padPadre = useRef<SignaturePadHandle>(null);
  const inputFirmaPadre = useRef<HTMLInputElement>(null);

  const esVirtual = modalidad === "virtual";

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (esVirtual) return;
        if (padPadre.current?.isEmpty()) {
          e.preventDefault();
          toast.error("Falta la firma del padre / madre / apoderado.");
          return;
        }
        if (inputFirmaPadre.current) inputFirmaPadre.current.value = padPadre.current!.toDataURL();
      }}
      className="rounded-xl border border-border bg-card shadow-sm"
    >
      <input type="hidden" name="alumno" value={alumnoId} />
      <input type="hidden" name="anio_academico_id" value={anioAcademicoId} />
      <input type="hidden" name="firma_padre" ref={inputFirmaPadre} />

      <div className="flex flex-col gap-5 p-5">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Periodo</Label>
            <SimpleSelect
              required
              name="periodo"
              defaultValue={periodoInicial}
              placeholder="Selecciona…"
              options={PERIODOS.map((p) => ({ value: p, label: p }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Modalidad</Label>
            <SimpleSelect
              required
              name="modalidad"
              placeholder="Selecciona…"
              value={modalidad}
              onValueChange={setModalidad}
              options={OPCIONES_MODALIDAD}
            />
          </div>
        </div>

        {esVirtual ? (
          <div className="flex items-start gap-3 rounded-lg border border-dashed border-border bg-secondary/40 p-4">
            <Link2 className="mt-0.5 size-5 flex-none text-primary" />
            <p className="text-sm text-muted-foreground">
              Se generará un enlace para que el padre / madre / apoderado escriba su observación y firme desde su
              propio dispositivo. Cuando responda, podrás escribir tu observación de cierre y concluir el acta.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <Label>Observación del padre de familia</Label>
              <Textarea
                name="observacion_padre"
                required
                placeholder="Comentarios y sugerencias del padre/madre sobre el servicio del colegio"
                className="min-h-28 w-full"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Observación del coordinador al cierre</Label>
              <Textarea name="observacion_coordinador" required className="min-h-28 w-full" />
            </div>

            <fieldset className="rounded-lg border border-border p-4">
              <legend className="px-1.5 text-sm font-bold text-primary">Firma en pantalla</legend>
              <div className="mx-auto flex max-w-sm flex-col gap-2">
                <SignaturePad ref={padPadre} label="Firma del padre / madre / apoderado" />
                <Input name="firma_padre_nombre" required placeholder="Nombre de quien firma" />
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Trazo simple en pantalla, sin certificado digital · se guarda con nombre, IP y fecha/hora, y cierra la
                reunión.
              </p>
            </fieldset>
          </>
        )}

        {state.error && (
          <p className="rounded-md bg-critical-soft px-3 py-2 text-sm text-critical">{state.error}</p>
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-border p-4">
        <Button type="button" variant="outline" onClick={() => router.push("/bienestar")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {esVirtual ? "Generar enlace" : "Guardar acta firmada"}
        </Button>
      </div>
    </form>
  );
}
