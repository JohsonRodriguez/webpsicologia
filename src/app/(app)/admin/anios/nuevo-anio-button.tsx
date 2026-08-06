"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { crearAnio } from "../actions";

export function NuevoAnioButton({ anios }: { anios: number[] }) {
  const [pending, startTransition] = useTransition();
  const siguiente = Math.max(...anios, new Date().getFullYear()) + 1;

  return (
    <Button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await crearAnio(siguiente);
          if (result?.error) toast.error(result.error);
          else toast.success(`Año ${siguiente} creado`);
        })
      }
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
      Crear año {siguiente}
    </Button>
  );
}
