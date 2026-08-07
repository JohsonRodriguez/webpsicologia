import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableRow } from "@/components/clickable-row";
import { PillEstadoCaso } from "@/components/status-pills";
import { nombreAlumno, type MatriculaInfo } from "@/lib/queries";

export type CasoFila = {
  id: string;
  alumno_id: string;
  tipo: string;
  estado: string;
  fecha_apertura: string;
  psicologo_id: string;
  psicologo_original_id: string | null;
  alumnos: { nombres: string; apellidos: string } | null;
  usuarios: { nombre: string } | null;
};

export function TablaCasos({
  casos,
  matriculas,
  mostrarPsicologo = false,
  baseHref = "/casos",
}: {
  casos: CasoFila[];
  matriculas: Map<string, MatriculaInfo>;
  mostrarPsicologo?: boolean;
  baseHref?: string;
}) {
  if (casos.length === 0) {
    return (
      <div className="px-4 py-14 text-center text-sm text-muted-foreground">
        No se encontraron casos con estos filtros.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Alumno</TableHead>
            <TableHead>Origen</TableHead>
            {mostrarPsicologo && <TableHead>Psicólogo</TableHead>}
            <TableHead>Apertura</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {casos.map((c) => {
            const mat = matriculas.get(c.alumno_id);
            const derivado = c.psicologo_original_id && c.psicologo_original_id !== c.psicologo_id;
            return (
              <ClickableRow key={c.id} href={`${baseHref}/${c.id}`}>
                <TableCell>
                  <div className="font-semibold">{c.alumnos ? nombreAlumno(c.alumnos) : "—"}</div>
                  <div className="text-xs text-muted-foreground">{mat?.gradoNombre ?? "—"}</div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground">
                    {c.tipo === "caso_1" ? "Desde incidencia" : "Caso directo"}
                  </span>
                </TableCell>
                {mostrarPsicologo && (
                  <TableCell className="text-muted-foreground">
                    {c.usuarios?.nombre ?? "—"}
                    {derivado && (
                      <span className="ml-1.5 inline-flex items-center rounded-full bg-purple px-2 py-0.5 text-[11px] font-bold text-white">
                        derivado
                      </span>
                    )}
                  </TableCell>
                )}
                <TableCell className="tabular-nums text-muted-foreground">
                  {new Date(c.fecha_apertura).toLocaleDateString("es-PE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <PillEstadoCaso estado={c.estado} />
                </TableCell>
              </ClickableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
