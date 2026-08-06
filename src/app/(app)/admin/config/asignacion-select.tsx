"use client";

import { useTransition } from "react";
import { toast } from "sonner";
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
    <select
      defaultValue={actual}
      disabled={pending}
      onChange={(e) =>
        startTransition(async () => {
          const result = await asignarPsicologoGrado(gradoId, e.target.value);
          if (result?.error) toast.error(result.error);
          else toast.success("Asignación actualizada");
        })
      }
      className="h-8 rounded-md border border-input bg-card px-2 text-sm disabled:opacity-50"
    >
      <option value="">Sin asignar</option>
      {psicologos.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nombre}
        </option>
      ))}
    </select>
  );
}
