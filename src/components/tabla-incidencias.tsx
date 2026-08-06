import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClickableRow } from "@/components/clickable-row";
import { PillEstadoIncidencia, PillPrioridad, BarraPrioridad } from "@/components/status-pills";
import { nombreAlumno, type MatriculaInfo } from "@/lib/queries";

export type IncidenciaFila = {
  id: string;
  alumno_id: string;
  prioridad: string;
  estado: string;
  fecha_hora: string;
  alumnos: { nombres: string; apellidos: string } | null;
  catalogo_motivos: { nombre: string } | null;
  usuarios: { nombre: string } | null;
};

export function TablaIncidencias({
  incidencias,
  matriculas,
  mostrarProfesor = false,
  baseHref = "/incidencias",
}: {
  incidencias: IncidenciaFila[];
  matriculas: Map<string, MatriculaInfo>;
  mostrarProfesor?: boolean;
  baseHref?: string;
}) {
  if (incidencias.length === 0) {
    return (
      <div className="px-4 py-14 text-center text-sm text-muted-foreground">
        No se encontraron incidencias con estos filtros.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-4"></TableHead>
            <TableHead>Alumno</TableHead>
            <TableHead>Motivo</TableHead>
            {mostrarProfesor && <TableHead>Profesor</TableHead>}
            <TableHead>Fecha</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidencias.map((inc) => {
            const mat = matriculas.get(inc.alumno_id);
            return (
              <ClickableRow key={inc.id} href={`${baseHref}/${inc.id}`}>
                <TableCell>
                  <BarraPrioridad prioridad={inc.prioridad} />
                </TableCell>
                <TableCell>
                  <div className="font-semibold">
                    {inc.alumnos ? nombreAlumno(inc.alumnos) : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {mat ? `${mat.gradoNombre} "${mat.seccionNombre}"` : "—"}
                  </div>
                </TableCell>
                <TableCell>{inc.catalogo_motivos?.nombre ?? "—"}</TableCell>
                {mostrarProfesor && (
                  <TableCell className="text-muted-foreground">
                    {inc.usuarios?.nombre ?? "—"}
                  </TableCell>
                )}
                <TableCell className="text-muted-foreground tabular-nums">
                  {new Date(inc.fecha_hora).toLocaleDateString("es-PE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <PillEstadoIncidencia estado={inc.estado} />
                </TableCell>
              </ClickableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export { PillPrioridad };
