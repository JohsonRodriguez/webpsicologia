"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { SimpleSelect } from "@/components/simple-select";
import { asignarTutor } from "../actions";

export function TutorSelect({
  seccionId,
  anioId,
  slot,
  actual,
  profesores,
}: {
  seccionId: string;
  anioId: string;
  slot: 1 | 2;
  actual: string;
  profesores: { id: string; nombre: string }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <SimpleSelect
      defaultValue={actual}
      disabled={pending}
      onValueChange={(value) =>
        startTransition(async () => {
          const result = await asignarTutor(seccionId, anioId, slot, value);
          if (result?.error) toast.error(result.error);
          else toast.success(`Tutor ${slot} actualizado`);
        })
      }
      placeholder={`Tutor ${slot}: sin asignar`}
      options={[{ value: "", label: "Sin asignar" }, ...profesores.map((p) => ({ value: p.id, label: p.nombre }))]}
    />
  );
}
