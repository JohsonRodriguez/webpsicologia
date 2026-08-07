"use client";

import { useMemo, useState } from "react";

type ConNivelGradoSeccion = {
  nivelId: string;
  nivelNombre: string;
  gradoId: string;
  gradoNombre: string;
  seccionId: string;
  seccionNombre: string;
};

function opcionesUnicas<T extends ConNivelGradoSeccion>(
  items: T[],
  idKey: "nivelId" | "gradoId" | "seccionId",
  nombreKey: "nivelNombre" | "gradoNombre" | "seccionNombre",
) {
  const mapa = new Map<string, string>();
  for (const it of items) mapa.set(it[idKey], it[nombreKey]);
  return [...mapa.entries()].map(([id, nombre]) => ({ id, nombre }));
}

export function FiltroAcademico<T extends ConNivelGradoSeccion>({
  items,
  children,
}: {
  items: T[];
  children: (filtrados: T[]) => React.ReactNode;
}) {
  const [nivelId, setNivelId] = useState("");
  const [gradoId, setGradoId] = useState("");
  const [seccionId, setSeccionId] = useState("");

  const niveles = useMemo(() => opcionesUnicas(items, "nivelId", "nivelNombre"), [items]);
  const grados = useMemo(
    () => opcionesUnicas(items.filter((it) => !nivelId || it.nivelId === nivelId), "gradoId", "gradoNombre"),
    [items, nivelId],
  );
  const secciones = useMemo(
    () =>
      opcionesUnicas(
        items.filter((it) => (!nivelId || it.nivelId === nivelId) && (!gradoId || it.gradoId === gradoId)),
        "seccionId",
        "seccionNombre",
      ),
    [items, nivelId, gradoId],
  );

  const filtrados = items.filter(
    (it) =>
      (!nivelId || it.nivelId === nivelId) &&
      (!gradoId || it.gradoId === gradoId) &&
      (!seccionId || it.seccionId === seccionId),
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5 border-b border-border p-4">
        <select
          value={nivelId}
          onChange={(e) => {
            setNivelId(e.target.value);
            setGradoId("");
            setSeccionId("");
          }}
          className="h-9 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="">Todos los niveles</option>
          {niveles.map((n) => (
            <option key={n.id} value={n.id}>
              {n.nombre}
            </option>
          ))}
        </select>
        <select
          value={gradoId}
          onChange={(e) => {
            setGradoId(e.target.value);
            setSeccionId("");
          }}
          className="h-9 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="">Todos los grados</option>
          {grados.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nombre}
            </option>
          ))}
        </select>
        <select
          value={seccionId}
          onChange={(e) => setSeccionId(e.target.value)}
          className="h-9 rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="">Todas las secciones</option>
          {secciones.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
        {(nivelId || gradoId || seccionId) && (
          <button
            type="button"
            onClick={() => {
              setNivelId("");
              setGradoId("");
              setSeccionId("");
            }}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Limpiar filtro
          </button>
        )}
      </div>
      {children(filtrados)}
    </>
  );
}
