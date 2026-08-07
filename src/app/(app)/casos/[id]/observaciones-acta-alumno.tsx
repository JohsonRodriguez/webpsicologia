"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Loader2, NotebookPen } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { guardarObservacionesActaAlumno } from "../actions";

export function ObservacionesActaAlumno({
  actaId,
  observacionesIniciales,
}: {
  actaId: string;
  observacionesIniciales: string | null;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(observacionesIniciales ?? "");
  const [pending, startTransition] = useTransition();

  function guardar() {
    startTransition(async () => {
      const result = await guardarObservacionesActaAlumno(actaId, valor);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Observaciones guardadas.");
        setEditando(false);
      }
    });
  }

  if (!editando) {
    return (
      <div className="rounded-lg border border-dashed border-border p-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <NotebookPen className="size-3.5" />
            Observaciones del psicólogo
          </p>
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="text-xs font-medium text-primary hover:underline"
          >
            {observacionesIniciales ? "Editar" : "Agregar"}
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{observacionesIniciales || "Sin observaciones todavía."}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border p-3">
      <Textarea
        autoFocus
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Observaciones después de la sesión con el alumno…"
        className="min-h-24"
        disabled={pending}
      />
      <div className="mt-2 flex justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => {
            setEditando(false);
            setValor(observacionesIniciales ?? "");
          }}
        >
          Cancelar
        </Button>
        <Button type="button" size="sm" disabled={pending} onClick={guardar}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          Guardar
        </Button>
      </div>
    </div>
  );
}
