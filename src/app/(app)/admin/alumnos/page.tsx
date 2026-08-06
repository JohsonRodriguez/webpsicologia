import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnioActivo, getEstructuraAcademica, getMatriculasPorAlumno, nombreAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableRow } from "@/components/clickable-row";
import { Button } from "@/components/ui/button";
import { FileUp } from "lucide-react";
import { NuevoAlumnoDialog } from "./nuevo-alumno-dialog";

export default async function AdminAlumnosPage() {
  await requireUsuario(["administrador"]);
  const supabase = await createClient();

  const anioActivo = await getAnioActivo(supabase);
  const { data: alumnos } = await supabase.from("alumnos").select("id, nombres, apellidos, codigo").order("apellidos");
  const matriculas = await getMatriculasPorAlumno(supabase);
  const estructura = await getEstructuraAcademica(supabase);

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Gestión de alumnos"
        description={`${alumnos?.length ?? 0} alumnos registrados · matrícula del año activo mostrada.`}
        actions={
          <>
            <Button variant="outline" disabled title="Requiere backend de importación">
              <FileUp className="size-4" />
              Importar Excel/CSV
            </Button>
            <NuevoAlumnoDialog estructura={estructura} anioActivoId={anioActivo?.id ?? ""} />
          </>
        }
      />
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alumno</TableHead>
              <TableHead>Grado y sección ({anioActivo?.anio ?? "—"})</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(alumnos ?? []).map((a) => {
              const mat = matriculas.get(a.id);
              return (
                <ClickableRow key={a.id} href={`/alumnos/${a.id}`}>
                  <TableCell>
                    <div className="font-semibold">{nombreAlumno(a)}</div>
                    <div className="font-mono text-xs text-muted-foreground">{a.codigo}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {mat ? `${mat.gradoNombre} "${mat.seccionNombre}"` : "Sin matrícula"}
                  </TableCell>
                </ClickableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
