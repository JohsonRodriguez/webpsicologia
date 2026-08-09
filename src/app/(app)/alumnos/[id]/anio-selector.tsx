"use client";

import { useRouter, usePathname } from "next/navigation";
import { SimpleSelect } from "@/components/simple-select";

export function AnioSelector({
  anios,
  seleccionado,
}: {
  anios: { id: string; anio: number; activo: boolean }[];
  seleccionado: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SimpleSelect
      defaultValue={seleccionado}
      onValueChange={(value) => router.push(`${pathname}?anio=${value}`)}
      placeholder="Selecciona un año…"
      className="w-auto"
      options={anios.map((a) => ({ value: a.id, label: `Año ${a.anio}${a.activo ? " (activo)" : ""}` }))}
    />
  );
}
