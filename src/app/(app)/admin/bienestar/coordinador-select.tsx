"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { SimpleSelect } from "@/components/simple-select";
import { asignarCoordinadorNivel } from "../actions";

export function CoordinadorSelect({
  nivelId,
  actual,
  coordinadores,
}: {
  nivelId: string;
  actual: string;
  coordinadores: { id: string; nombre: string }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <SimpleSelect
      defaultValue={actual}
      disabled={pending}
      onValueChange={(value) =>
        startTransition(async () => {
          const result = await asignarCoordinadorNivel(nivelId, value);
          if (result?.error) toast.error(result.error);
          else toast.success("Asignación actualizada");
        })
      }
      placeholder="Sin asignar"
      options={[{ value: "", label: "Sin asignar" }, ...coordinadores.map((c) => ({ value: c.id, label: c.nombre }))]}
    />
  );
}
