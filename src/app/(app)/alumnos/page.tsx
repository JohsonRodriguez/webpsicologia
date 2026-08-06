import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnioActivo, nombreAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableRow } from "@/components/clickable-row";

export default async function AlumnosPage() {
  const usuario = await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();
  const anioActivo = await getAnioActivo(supabase);

  let query = supabase
    .from("matriculas")
    .select("alumno_id, grado_id, seccion_id, alumnos(id, nombres, apellidos, codigo), grados(nombre), secciones(nombre)")
    .eq("anio_academico_id", anioActivo?.id ?? "");

  if (usuario.rol === "psicologo") {
    const { data: grados } = await supabase.from("psicologo_grado").select("grado_id").eq("usuario_id", usuario.id);
    const gradoIds = (grados ?? []).map((g) => g.grado_id);
    query = query.in("grado_id", gradoIds.length ? gradoIds : ["00000000-0000-0000-0000-000000000000"]);
  }

  const { data: matriculas } = await query;
  const alumnoIds = (matriculas ?? []).map((m) => m.alumno_id);

  const { data: casosAbiertos } = await supabase
    .from("casos")
    .select("alumno_id")
    .neq("estado", "cerrado")
    .in("alumno_id", alumnoIds.length ? alumnoIds : ["00000000-0000-0000-0000-000000000000"]);

  const conCasoAbierto = new Set((casosAbiertos ?? []).map((c) => c.alumno_id));

  const filas = (matriculas ?? [])
    .map((m) => ({
      id: m.alumno_id,
      alumno: m.alumnos as unknown as { nombres: string; apellidos: string; codigo: string },
      grado: (m.grados as unknown as { nombre: string } | null)?.nombre ?? "",
      seccion: (m.secciones as unknown as { nombre: string } | null)?.nombre ?? "",
    }))
    .sort((a, b) => a.alumno.apellidos.localeCompare(b.alumno.apellidos));

  return (
    <>
      <PageHeader
        eyebrow="Alumnos"
        title={usuario.rol === "jefe_psicologia" ? "Alumnos del colegio" : "Alumnos de mi nivel"}
        description="Consulta la ficha de cualquier alumno, tenga o no un caso abierto contigo."
      />
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {filas.length === 0 ? (
          <p className="px-4 py-14 text-center text-sm text-muted-foreground">
            No hay alumnos asignados a tu nivel.
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
              {filas.map((f) => (
                <ClickableRow key={f.id} href={`/alumnos/${f.id}`}>
                  <TableCell>
                    <div className="font-semibold">{nombreAlumno(f.alumno)}</div>
                    <div className="font-mono text-xs text-muted-foreground">{f.alumno.codigo}</div>
                  </TableCell>
                  <TableCell>
                    {f.grado} &quot;{f.seccion}&quot;
                  </TableCell>
                  <TableCell>
                    {conCasoAbierto.has(f.id) ? (
                      <span className="inline-flex items-center rounded-full bg-warn-soft px-2.5 py-1 text-xs font-bold text-warn">
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
    </>
  );
}
