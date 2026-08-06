"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { abrirCasoDesdeIncidencia } from "@/app/(app)/casos/actions";

export function AbrirCasoButton({
  incidenciaId,
  children,
}: {
  incidenciaId: string;
  children: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      className="w-full"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await abrirCasoDesdeIncidencia(incidenciaId);
          if (result?.error) {
            toast.error(result.error);
          } else {
            router.refresh();
          }
        })
      }
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : children}
    </Button>
  );
}
