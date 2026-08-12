"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SimpleSelect } from "@/components/simple-select";

export type FilaBienestar = {
  alumnoId: string;
  nombre: string;
  gradoId: string;
  gradoNombre: string;
  seccionId: string;
  seccionNombre: string;
  estado: "pendiente" | "concluida";
  reunionId?: string;
};

const ESTADOS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "concluida", label: "Concluida" },
];

export function BienestarFiltro({ filas, periodo }: { filas: FilaBienestar[]; periodo: string }) {
  const [gradoId, setGradoId] = useState("");
  const [seccionId, setSeccionId] = useState("");
  const [estado, setEstado] = useState("");

  const grados = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const f of filas) mapa.set(f.gradoId, f.gradoNombre);
    return [...mapa.entries()].map(([id, nombre]) => ({ id, nombre }));
  }, [filas]);

  const secciones = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const f of filas) if (!gradoId || f.gradoId === gradoId) mapa.set(f.seccionId, f.seccionNombre);
    return [...mapa.entries()].map(([id, nombre]) => ({ id, nombre }));
  }, [filas, gradoId]);

  const filtradas = filas.filter(
    (f) =>
      (!gradoId || f.gradoId === gradoId) &&
      (!seccionId || f.seccionId === seccionId) &&
      (!estado || f.estado === estado),
  );

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-2.5 border-b border-border p-4">
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
        <SimpleSelect
          className="w-auto"
          value={estado}
          onValueChange={setEstado}
          placeholder="Todos los estados"
          options={ESTADOS}
        />
        {(gradoId || seccionId || estado) && (
          <button
            type="button"
            onClick={() => {
              setGradoId("");
              setSeccionId("");
              setEstado("");
            }}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Limpiar filtro
          </button>
        )}
      </div>

      {filtradas.length === 0 ? (
        <p className="px-4 py-14 text-center text-sm text-muted-foreground">
          No hay alumnos que coincidan con el filtro.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alumno</TableHead>
              <TableHead>Grado y sección</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.map((f) => (
              <TableRow key={f.alumnoId}>
                <TableCell className="font-semibold">{f.nombre}</TableCell>
                <TableCell className="text-muted-foreground">
                  {f.gradoNombre} &quot;{f.seccionNombre}&quot;
                </TableCell>
                <TableCell>
                  <span
                    className={
                      f.estado === "concluida"
                        ? "inline-flex items-center rounded-full bg-good px-2.5 py-1 text-xs font-bold text-white"
                        : "inline-flex items-center rounded-full bg-warn px-2.5 py-1 text-xs font-bold text-white"
                    }
                  >
                    {f.estado === "concluida" ? "Concluida" : "Pendiente"}
                  </span>
                </TableCell>
                <TableCell>
                  {f.reunionId ? (
                    <Link href={`/bienestar/${f.reunionId}`} className="text-sm font-medium text-primary hover:underline">
                      {f.estado === "concluida" ? "Ver acta" : "Continuar"}
                    </Link>
                  ) : (
                    <Link
                      href={`/bienestar/nueva?alumno=${f.alumnoId}&periodo=${encodeURIComponent(periodo)}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Registrar
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
