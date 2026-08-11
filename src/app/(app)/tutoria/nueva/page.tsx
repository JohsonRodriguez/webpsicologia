import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnioActivo, nombreAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { ActaTutoriaForm } from "./acta-tutoria-form";

export default async function NuevaActaTutoriaPage() {
  const usuario = await requireUsuario(["profesor"]);
  const supabase = await createClient();
  const anioActivo = await getAnioActivo(supabase);

  const { data: aulas } = await supabase
    .from("tutoria_aula")
    .select("seccion_id")
    .eq("usuario_id", usuario.id)
    .eq("anio_academico_id", anioActivo?.id ?? "")
    .is("fecha_fin", null);

  const seccionIds = (aulas ?? []).map((a) => a.seccion_id);

  const { data: matriculas } = seccionIds.length
    ? await supabase
        .from("matriculas")
        .select("alumno_id, alumnos(nombres, apellidos, codigo)")
        .in("seccion_id", seccionIds)
        .eq("anio_academico_id", anioActivo?.id ?? "")
    : { data: [] };

  const alumnos = (matriculas ?? [])
    .map((m) => {
      const alumno = m.alumnos as unknown as { nombres: string; apellidos: string; codigo: string } | null;
      return { alumnoId: m.alumno_id, nombre: alumno ? nombreAlumno(alumno) : "—", codigo: alumno?.codigo ?? "" };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const { data: perfil } = await supabase.from("usuarios").select("firma_guardada").eq("id", usuario.id).maybeSingle();

  return (
    <>
      <PageHeader
        eyebrow="Tutoría"
        title="Registrar reunión de tutoría"
        description="Documenta una reunión con el padre/madre/apoderado de un alumno de tu aula de tutoría."
      />
      <ActaTutoriaForm alumnos={alumnos} tieneFirmaGuardada={Boolean(perfil?.firma_guardada)} />
    </>
  );
}
