import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnioActivo, getEstructuraAcademica } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { ActaDocenteForm } from "./acta-docente-form";

export default async function NuevaActaDocentePage() {
  const usuario = await requireUsuario(["profesor"]);
  const supabase = await createClient();

  const anioActivo = await getAnioActivo(supabase);
  const estructura = await getEstructuraAcademica(supabase);

  const { data: matriculas } = await supabase
    .from("matriculas")
    .select("alumno_id, seccion_id, alumnos(nombres, apellidos, codigo)")
    .eq("anio_academico_id", anioActivo?.id ?? "");

  const alumnosPorSeccion = (matriculas ?? []).map((m) => ({
    alumnoId: m.alumno_id,
    seccionId: m.seccion_id,
    nombre: `${(m.alumnos as unknown as { nombres: string; apellidos: string } | null)?.nombres ?? ""} ${(m.alumnos as unknown as { nombres: string; apellidos: string } | null)?.apellidos ?? ""}`.trim(),
    codigo: (m.alumnos as unknown as { codigo: string } | null)?.codigo ?? "",
  }));

  const { data: perfil } = await supabase.from("usuarios").select("firma_guardada").eq("id", usuario.id).maybeSingle();

  return (
    <>
      <PageHeader
        eyebrow="Actas con padres"
        title="Registrar reunión con padres"
        description="Documenta una reunión que sostuviste con el padre/madre/apoderado, sin necesidad de reportar una incidencia."
      />
      <ActaDocenteForm estructura={estructura} alumnosPorSeccion={alumnosPorSeccion} tieneFirmaGuardada={Boolean(perfil?.firma_guardada)} />
    </>
  );
}
