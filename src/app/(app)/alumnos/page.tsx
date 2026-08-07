import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnioActivo } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { AlumnosFiltro, type FilaAlumno } from "./alumnos-filtro";

export default async function AlumnosPage() {
  const usuario = await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();
  const anioActivo = await getAnioActivo(supabase);

  let query = supabase
    .from("matriculas")
    .select(
      "alumno_id, grado_id, seccion_id, alumnos(id, nombres, apellidos, codigo), grados(nombre, nivel_id, niveles(nombre)), secciones(nombre)",
    )
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

  const filas: FilaAlumno[] = (matriculas ?? [])
    .map((m) => {
      const alumno = m.alumnos as unknown as { nombres: string; apellidos: string; codigo: string };
      const grado = m.grados as unknown as { nombre: string; nivel_id: string; niveles: { nombre: string } | null } | null;
      const seccion = m.secciones as unknown as { nombre: string } | null;
      return {
        id: m.alumno_id,
        nombres: alumno.nombres,
        apellidos: alumno.apellidos,
        codigo: alumno.codigo,
        nivelId: grado?.nivel_id ?? "",
        nivelNombre: grado?.niveles?.nombre ?? "—",
        gradoId: m.grado_id,
        gradoNombre: grado?.nombre ?? "",
        seccionId: m.seccion_id,
        seccionNombre: seccion?.nombre ?? "",
        tieneCasoAbierto: conCasoAbierto.has(m.alumno_id),
      };
    })
    .sort((a, b) => a.apellidos.localeCompare(b.apellidos));

  return (
    <>
      <PageHeader
        eyebrow="Alumnos"
        title={usuario.rol === "jefe_psicologia" ? "Alumnos del colegio" : "Alumnos de mi nivel"}
        description="Consulta la ficha de cualquier alumno, tenga o no un caso abierto contigo. Filtra por nivel, grado y sección."
      />
      {filas.length === 0 ? (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <p className="px-4 py-14 text-center text-sm text-muted-foreground">
            No hay alumnos asignados a tu nivel.
          </p>
        </div>
      ) : (
        <AlumnosFiltro filas={filas} />
      )}
    </>
  );
}
