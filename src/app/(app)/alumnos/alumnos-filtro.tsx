"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ClickableRow } from "@/components/clickable-row";
import { FiltroAcademico } from "@/components/filtro-academico";

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
};

export function AlumnosFiltro({ filas }: { filas: FilaAlumno[] }) {
  const [busqueda, setBusqueda] = useState("");

  const filasBuscadas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return filas;
    return filas.filter((f) => `${f.nombres} ${f.apellidos} ${f.codigo}`.toLowerCase().includes(q));
  }, [filas, busqueda]);

  return (
    <div className="flex flex-col gap-3.5">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o código…"
          className="pl-9"
        />
      </div>
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <FiltroAcademico items={filasBuscadas}>
          {(filtradas) =>
            filtradas.length === 0 ? (
              <p className="px-4 py-14 text-center text-sm text-muted-foreground">
                No hay alumnos que coincidan con el filtro.
              </p>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alumno</TableHead>
                  <TableHead>Grado y sección</TableHead>
                  <TableHead>Ver ficha</TableHead>
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
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                        Ver ficha
                        <ArrowRight className="size-3.5" />
                      </span>
                    </TableCell>
                  </ClickableRow>
                ))}
              </TableBody>
            </Table>
          )
        }
        </FiltroAcademico>
      </div>
    </div>
  );
}
