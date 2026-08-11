import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnioActivo } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function TutoriasDocentesPage() {
  const usuario = await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();
  const anioActivo = await getAnioActivo(supabase);

  let gradoIds: string[] | null = null;
  if (usuario.rol === "psicologo") {
    const { data: grados } = await supabase.from("psicologo_grado").select("grado_id").eq("usuario_id", usuario.id);
    gradoIds = (grados ?? []).map((g) => g.grado_id);
  }

  let seccionesQuery = supabase.from("secciones").select("id, nombre, grado_id, grados(nombre)");
  if (gradoIds) seccionesQuery = seccionesQuery.in("grado_id", gradoIds.length ? gradoIds : ["00000000-0000-0000-0000-000000000000"]);
  const { data: secciones } = await seccionesQuery;
  const seccionIds = (secciones ?? []).map((s) => s.id);
  const seccionPorId = new Map(
    (secciones ?? []).map((s) => [
      s.id,
      { nombre: s.nombre, gradoNombre: (s.grados as unknown as { nombre: string } | null)?.nombre ?? "" },
    ]),
  );

  const [{ data: aulas }, { data: matriculas }, { data: actas }] = await Promise.all([
    supabase
      .from("tutoria_aula")
      .select("seccion_id, usuario_id, usuarios(nombre)")
      .eq("anio_academico_id", anioActivo?.id ?? "")
      .is("fecha_fin", null)
      .in("seccion_id", seccionIds.length ? seccionIds : ["00000000-0000-0000-0000-000000000000"]),
    supabase
      .from("matriculas")
      .select("alumno_id, seccion_id")
      .in("seccion_id", seccionIds.length ? seccionIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("anio_academico_id", anioActivo?.id ?? ""),
    // Sin filtro adicional: la policy RLS de actas_tutoria ya limita las filas
    // a los alumnos de los grados de este psicólogo (o a todas para jefatura).
    supabase.from("actas_tutoria").select("tutor_id, alumno_id"),
  ]);

  const alumnosPorSeccion = new Map<string, string[]>();
  for (const m of matriculas ?? []) {
    const lista = alumnosPorSeccion.get(m.seccion_id) ?? [];
    lista.push(m.alumno_id);
    alumnosPorSeccion.set(m.seccion_id, lista);
  }

  const actasPorTutor = new Map<string, Set<string>>();
  for (const a of actas ?? []) {
    const set = actasPorTutor.get(a.tutor_id) ?? new Set<string>();
    set.add(a.alumno_id);
    actasPorTutor.set(a.tutor_id, set);
  }

  type FilaTutor = { tutorId: string; nombre: string; aulas: string[]; totalAlumnos: number; completadas: number };
  const porTutor = new Map<string, FilaTutor>();
  for (const a of aulas ?? []) {
    const tutorNombre = (a.usuarios as unknown as { nombre: string } | null)?.nombre ?? "—";
    const seccionInfo = seccionPorId.get(a.seccion_id);
    const etiquetaAula = seccionInfo ? `${seccionInfo.gradoNombre} "${seccionInfo.nombre}"` : "—";
    const fila = porTutor.get(a.usuario_id) ?? { tutorId: a.usuario_id, nombre: tutorNombre, aulas: [], totalAlumnos: 0, completadas: 0 };
    fila.aulas.push(etiquetaAula);
    fila.totalAlumnos += (alumnosPorSeccion.get(a.seccion_id) ?? []).length;
    porTutor.set(a.usuario_id, fila);
  }

  const filas = [...porTutor.values()]
    .map((f) => {
      const completadas = actasPorTutor.get(f.tutorId)?.size ?? 0;
      return { ...f, completadas: Math.min(completadas, f.totalAlumnos), faltantes: Math.max(f.totalAlumnos - completadas, 0) };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const totalTutores = filas.length;
  const tutoresCompletos = filas.filter((f) => f.totalAlumnos > 0 && f.faltantes === 0).length;
  const tutorConMasFaltantes = [...filas].sort((a, b) => b.faltantes - a.faltantes)[0];

  return (
    <>
      <PageHeader
        eyebrow="Psicología"
        title="Tutorías"
        description="Seguimiento de las reuniones de tutoría: qué docentes ya completaron las suyas y a quiénes les falta."
      />

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Total de tutores</p>
          <p className="font-heading text-3xl">{totalTutores}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Completaron todas</p>
          <p className="font-heading text-3xl text-good">{tutoresCompletos}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Con más pendientes</p>
          <p className="font-heading truncate text-lg">{tutorConMasFaltantes?.faltantes ? tutorConMasFaltantes.nombre : "—"}</p>
          {tutorConMasFaltantes?.faltantes ? (
            <p className="text-xs text-muted-foreground">{tutorConMasFaltantes.faltantes} pendientes</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        {filas.length === 0 ? (
          <p className="px-4 py-14 text-center text-sm text-muted-foreground">No hay tutores asignados todavía.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tutor</TableHead>
                <TableHead>Aula(s)</TableHead>
                <TableHead>Total alumnos</TableHead>
                <TableHead>Completadas</TableHead>
                <TableHead>Faltantes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((f) => (
                <TableRow key={f.tutorId}>
                  <TableCell className="font-semibold">{f.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{f.aulas.join(", ")}</TableCell>
                  <TableCell className="tabular-nums">{f.totalAlumnos}</TableCell>
                  <TableCell className="tabular-nums text-good">{f.completadas}</TableCell>
                  <TableCell className="tabular-nums text-warn">{f.faltantes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}
