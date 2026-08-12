"use client";

import { useActionState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cerrarReunionBienestar, type EstadoAccion } from "../actions";

const initialState: EstadoAccion = {};

export function CerrarReunionForm({ reunionId }: { reunionId: string }) {
  const accion = cerrarReunionBienestar.bind(null, reunionId);
  const [state, formAction, pending] = useActionState(accion, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>Observación del coordinador al cierre</Label>
        <Textarea name="observacion_coordinador" required className="min-h-28 w-full" />
      </div>
      {state.error && <p className="rounded-md bg-critical-soft px-3 py-2 text-sm text-critical">{state.error}</p>}
      <Button type="submit" disabled={pending} className="self-end">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
        Concluir acta
      </Button>
    </form>
  );
}
