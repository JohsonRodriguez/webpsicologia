import { TriangleAlert } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnioActivo, nombreAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableRow } from "@/components/clickable-row";

export default async function TutoriaAlumnosPage() {
  const usuario = await requireUsuario(["profesor"]);
  const supabase = await createClient();
  const anioActivo = await getAnioActivo(supabase);

  const { data: aulas } = await supabase
    .from("tutoria_aula")
    .select("seccion_id, secciones(nombre, grados(nombre, nivel_id, niveles(nombre)))")
    .eq("usuario_id", usuario.id)
    .eq("anio_academico_id", anioActivo?.id ?? "")
    .is("fecha_fin", null);

  const seccionIds = (aulas ?? []).map((a) => a.seccion_id);

  const { data: matriculas } = seccionIds.length
    ? await supabase
        .from("matriculas")
        .select("alumno_id, seccion_id, alumnos(nombres, apellidos), secciones(nombre, grados(nombre))")
        .in("seccion_id", seccionIds)
        .eq("anio_academico_id", anioActivo?.id ?? "")
    : { data: [] };

  // Sin .in() por alumno_id: la policy RLS nueva "tutor ve incidencias de su
  // aula" ya limita las filas a los alumnos de las secciones que tutorea.
  const { data: incidencias } = await supabase.from("incidencias").select("alumno_id");
  const conteoPorAlumno = new Map<string, number>();
  for (const i of incidencias ?? []) conteoPorAlumno.set(i.alumno_id, (conteoPorAlumno.get(i.alumno_id) ?? 0) + 1);

  const filas = (matriculas ?? [])
    .map((m) => {
      const alumno = m.alumnos as unknown as { nombres: string; apellidos: string } | null;
      const seccion = m.secciones as unknown as { nombre: string; grados: { nombre: string } | null } | null;
      return {
        alumnoId: m.alumno_id,
        nombre: alumno ? nombreAlumno(alumno) : "—",
        gradoNombre: seccion?.grados?.nombre ?? "",
        seccionNombre: seccion?.nombre ?? "",
        incidencias: conteoPorAlumno.get(m.alumno_id) ?? 0,
      };
    })
    .sort((a, b) => b.incidencias - a.incidencias || a.nombre.localeCompare(b.nombre));

  const alumnoConMasIncidencias = filas[0]?.incidencias > 0 ? filas[0] : null;

  const nombresAulas = (aulas ?? [])
    .map((a) => {
      const s = a.secciones as unknown as { nombre: string; grados: { nombre: string } | null } | null;
      return s ? `${s.grados?.nombre ?? ""} "${s.nombre}"` : null;
    })
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <PageHeader
        eyebrow="Tutoría"
        title="Alumnos de mi tutoría"
        description={
          seccionIds.length > 0
            ? `Aula(s) que tutoreas este año: ${nombresAulas}.`
            : "No tienes ningún aula asignada como tutor este año lectivo."
        }
      />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Total de alumnos</p>
          <p className="font-heading text-3xl">{filas.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <TriangleAlert className="size-3.5" />
            Alumno con más incidencias
          </p>
          {alumnoConMasIncidencias ? (
            <>
              <p className="font-heading truncate text-lg leading-tight">{alumnoConMasIncidencias.nombre}</p>
              <p className="text-xs text-muted-foreground">
                {alumnoConMasIncidencias.incidencias}{" "}
                {alumnoConMasIncidencias.incidencias === 1 ? "incidencia" : "incidencias"}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sin incidencias registradas</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        {filas.length === 0 ? (
          <p className="px-4 py-14 text-center text-sm text-muted-foreground">
            {seccionIds.length > 0
              ? "No hay alumnos matriculados en tu aula este año."
              : "Cuando el administrador te asigne un aula, tus alumnos van a aparecer aquí."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alumno</TableHead>
                <TableHead>Grado y sección</TableHead>
                <TableHead>Incidencias</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((f) => (
                <ClickableRow key={f.alumnoId} href={`/tutoria/alumnos/${f.alumnoId}`}>
                  <TableCell className="font-semibold">{f.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {f.gradoNombre} &quot;{f.seccionNombre}&quot;
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        f.incidencias > 0
                          ? "inline-flex items-center rounded-full bg-warn-soft px-2.5 py-1 text-xs font-bold text-warn"
                          : "inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground"
                      }
                    >
                      {f.incidencias}
                    </span>
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
