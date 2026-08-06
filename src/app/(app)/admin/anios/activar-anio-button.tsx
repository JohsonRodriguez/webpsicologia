"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { activarAnio } from "../actions";

export function ActivarAnioButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("¿Marcar este año como activo? El año actualmente activo se cerrará.")) return;
        startTransition(async () => {
          const result = await activarAnio(id);
          if (result?.error) toast.error(result.error);
          else toast.success("Año académico activado");
        });
      }}
    >
      {pending && <Loader2 className="size-3.5 animate-spin" />}
      Marcar como activo
    </Button>
  );
}
