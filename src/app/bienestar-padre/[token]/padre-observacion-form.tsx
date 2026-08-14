"use client";

import { useActionState, useRef } from "react";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SignaturePad, type SignaturePadHandle } from "@/components/signature-pad";
import { enviarObservacionPadre, type EstadoAccion } from "../../(app)/bienestar/actions";

const initialState: EstadoAccion = {};

export function PadreObservacionForm({ token }: { token: string }) {
  const accion = enviarObservacionPadre.bind(null, token);
  const [state, formAction, pending] = useActionState(accion, initialState);

  const pad = useRef<SignaturePadHandle>(null);
  const inputFirma = useRef<HTMLInputElement>(null);

  if (state.ok) {
    return (
      <p className="rounded-md bg-good-soft px-4 py-3 text-center text-sm font-medium text-good">
        ¡Gracias! Tu observación y firma fueron registradas correctamente.
      </p>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (pad.current?.isEmpty()) {
          e.preventDefault();
          toast.error("Falta tu firma.");
          return;
        }
        if (inputFirma.current) inputFirma.current.value = pad.current!.toDataURL();
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="firma_padre" ref={inputFirma} />

      <div className="flex flex-col gap-1.5">
        <Label>Tu observación sobre el servicio del colegio</Label>
        <Textarea name="observacion_padre" required maxLength={4000} className="min-h-28 w-full" />
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-col gap-2">
        <SignaturePad ref={pad} label="Tu firma" />
        <Input name="firma_padre_nombre" required maxLength={160} placeholder="Tu nombre completo" />
      </div>

      {state.error && <p className="rounded-md bg-critical-soft px-3 py-2 text-sm text-critical">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        Enviar
      </Button>
    </form>
  );
}
