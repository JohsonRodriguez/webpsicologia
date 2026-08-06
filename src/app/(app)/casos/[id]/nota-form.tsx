"use client";

import { useRef, useTransition } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { agregarNota } from "../actions";

export function NotaForm({ casoId }: { casoId: string }) {
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      className="mt-1.5 flex flex-col gap-2"
      action={(formData) => {
        const contenido = String(formData.get("contenido") ?? "");
        startTransition(async () => {
          const result = await agregarNota(casoId, contenido);
          if (result?.error) toast.error(result.error);
          else ref.current?.reset();
        });
      }}
    >
      <Textarea name="contenido" required placeholder="Añadir nota de seguimiento…" />
      <Button type="submit" disabled={pending} className="self-end">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Agregar nota
      </Button>
    </form>
  );
}
