"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { SimpleSelect } from "@/components/simple-select";
import { asignarPsicologoGrado } from "../actions";

export function AsignacionSelect({
  gradoId,
  actual,
  psicologos,
}: {
  gradoId: string;
  actual: string;
  psicologos: { id: string; nombre: string }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <SimpleSelect
      defaultValue={actual}
      disabled={pending}
      onValueChange={(value) =>
        startTransition(async () => {
          const result = await asignarPsicologoGrado(gradoId, value);
          if (result?.error) toast.error(result.error);
          else toast.success("Asignación actualizada");
        })
      }
      placeholder="Sin asignar"
      options={[{ value: "", label: "Sin asignar" }, ...psicologos.map((p) => ({ value: p.id, label: p.nombre }))]}
    />
  );
}
