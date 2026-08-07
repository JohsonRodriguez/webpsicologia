"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  tieneCasoAbierto: boolean;
};

export function AlumnosFiltro({ filas }: { filas: FilaAlumno[] }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <FiltroAcademico items={filas}>
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
          )
        }
      </FiltroAcademico>
    </div>
  );
}
