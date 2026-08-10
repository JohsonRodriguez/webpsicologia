"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { firmarActaProfesor, type EstadoAccion } from "./actions";

const initialState: EstadoAccion = {};

export function FirmarActaButton({ citaId, tieneFirmaGuardada }: { citaId: string; tieneFirmaGuardada: boolean }) {
  const [state, formAction, pending] = useActionState(firmarActaProfesor, initialState);

  useEffect(() => {
    if (state.ok) toast.success("Acta firmada.");
  }, [state]);

  if (!tieneFirmaGuardada) {
    return (
      <div className="flex items-start gap-2 rounded-md bg-info-soft px-3 py-2 text-xs text-info">
        <Info className="mt-0.5 size-3.5 flex-none" />
        <span>
          No tienes una firma guardada: para firmar esta acta, primero guarda una en{" "}
          <Link href="/mi-firma" className="font-semibold underline">
            Mi firma
          </Link>
          .
        </span>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("¿Firmar esta acta con tu firma guardada?")) e.preventDefault();
      }}
      className="self-end"
    >
      <input type="hidden" name="cita_id" value={citaId} />
      {state.error && <p className="mb-2 text-xs text-critical">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
        Firmar acta
      </Button>
    </form>
  );
}
