"use client";

import { useRouter, usePathname } from "next/navigation";

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
    <select
      defaultValue={seleccionado}
      onChange={(e) => router.push(`${pathname}?anio=${e.target.value}`)}
      className="h-9 rounded-md border border-input bg-card px-3 text-sm"
    >
      {anios.map((a) => (
        <option key={a.id} value={a.id}>
          Año {a.anio}
          {a.activo ? " (activo)" : ""}
        </option>
      ))}
    </select>
  );
}
