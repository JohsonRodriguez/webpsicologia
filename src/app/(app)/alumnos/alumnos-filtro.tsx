"use client";

import { useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableRow } from "@/components/clickable-row";

export type FilaAlumno = {
  id: string;
  nombres: string;
  apellidos: string;
  codigo: string;
  nivelId: string;
  nivelNombre: string;
  gradoId: string;
  gradoNombre: string;
  seccionId: string;
  seccionNombre: string;
  tieneCasoAbierto: boolean;
};

function opcionesUnicas(filas: FilaAlumno[], idKey: "nivelId" | "gradoId" | "seccionId", nombreKey: "nivelNombre" | "gradoNombre" | "seccionNombre") {
  const mapa = new Map<string, string>();
  for (const f of filas) mapa.set(f[idKey], f[nombreKey]);
  return [...mapa.entries()].map(([id, nombre]) => ({ id, nombre }));
}

export function AlumnosFiltro({ filas }: { filas: FilaAlumno[] }) {
  const [nivelId, setNivelId] = useState("");
  const [gradoId, setGradoId] = useState("");
  const [seccionId, setSeccionId] = useState("");

  const niveles = useMemo(() => opcionesUnicas(filas, "nivelId", "nivelNombre"), [filas]);
  const grados = useMemo(
    () => opcionesUnicas(filas.filter((f) => !nivelId || f.nivelId === nivelId), "gradoId", "gradoNombre"),
    [filas, nivelId],
  );
  const secciones = useMemo(
    () =>
      opcionesUnicas(
        filas.filter((f) => (!nivelId || f.nivelId === nivelId) && (!gradoId || f.gradoId === gradoId)),
        "seccionId",
        "seccionNombre",
      ),
    [filas, nivelId, gradoId],
  );

  const filtradas = filas.filter(
    (f) =>
      (!nivelId || f.nivelId === nivelId) &&
      (!gradoId || f.gradoId === gradoId) &&
      (!seccionId || f.seccionId === seccionId),
  );

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
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
              <TableHead>Seguimiento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtradas.map((f) => (
              <ClickableRow key={f.id} href={`/alumnos/${f.id}`}>
                <TableCell>
                  <div className="font-semibold">
                    {f.nombres} {f.apellidos}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">{f.codigo}</div>
                </TableCell>
                <TableCell>
                  {f.gradoNombre} &quot;{f.seccionNombre}&quot;
                </TableCell>
                <TableCell>
                  {f.tieneCasoAbierto ? (
                    <span className="inline-flex items-center rounded-full bg-warn px-2.5 py-1 text-xs font-bold text-white">
                      Caso activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground">
                      Sin caso abierto
                    </span>
                  )}
                </TableCell>
              </ClickableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
