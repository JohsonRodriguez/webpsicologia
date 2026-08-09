"use client";

import { useMemo, useState } from "react";
import { SimpleSelect } from "@/components/simple-select";

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
        <SimpleSelect
          className="w-auto"
          value={nivelId}
          onValueChange={(v) => {
            setNivelId(v);
            setGradoId("");
            setSeccionId("");
          }}
          placeholder="Todos los niveles"
          options={niveles.map((n) => ({ value: n.id, label: n.nombre }))}
        />
        <SimpleSelect
          className="w-auto"
          value={gradoId}
          onValueChange={(v) => {
            setGradoId(v);
            setSeccionId("");
          }}
          placeholder="Todos los grados"
          options={grados.map((g) => ({ value: g.id, label: g.nombre }))}
        />
        <SimpleSelect
          className="w-auto"
          value={seccionId}
          onValueChange={setSeccionId}
          placeholder="Todas las secciones"
          options={secciones.map((s) => ({ value: s.id, label: s.nombre }))}
        />
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
