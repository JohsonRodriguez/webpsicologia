"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cerrarCaso } from "../actions";

export function CerrarCasoButton({ casoId }: { casoId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() => {
        if (!confirm("¿Cerrar este caso? Si viene de una incidencia, también se cerrará.")) return;
        startTransition(async () => {
          const result = await cerrarCaso(casoId);
          if (result?.error) toast.error(result.error);
          else toast.success("Caso cerrado");
        });
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
      Cerrar caso
    </Button>
  );
}
