"use client";

import { useRouter, usePathname } from "next/navigation";
import { SimpleSelect } from "@/components/simple-select";
import { PERIODOS } from "@/lib/periodos";

export function PeriodoSelector({ seleccionado }: { seleccionado: string }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SimpleSelect
      defaultValue={seleccionado}
      onValueChange={(value) => router.push(`${pathname}?periodo=${encodeURIComponent(value)}`)}
      placeholder="Selecciona un periodo…"
      className="w-auto"
      options={PERIODOS.map((p) => ({ value: p, label: p }))}
    />
  );
}
