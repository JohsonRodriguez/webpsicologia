"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function NuevasIncidenciasToast({ cantidad, href }: { cantidad: number; href: string }) {
  const router = useRouter();

  useEffect(() => {
    if (cantidad <= 0) return;
    toast.info(
      cantidad === 1 ? "Tienes 1 incidencia nueva sin revisar." : `Tienes ${cantidad} incidencias nuevas sin revisar.`,
      { action: { label: "Ver", onClick: () => router.push(href) } },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cantidad, href]);

  return null;
}
