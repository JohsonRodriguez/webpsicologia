import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnioActivo, getCatalogoMotivos, getEstructuraAcademica } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { IncidenciaForm } from "./incidencia-form";

export default async function NuevaIncidenciaPage() {
  await requireUsuario(["profesor"]);
  const supabase = await createClient();

  const anioActivo = await getAnioActivo(supabase);
  const estructura = await getEstructuraAcademica(supabase);
  const motivos = await getCatalogoMotivos(supabase);

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

  return (
    <>
      <PageHeader
        eyebrow="Nuevo reporte"
        title="Reportar incidencia"
        description="La fecha y hora se registran automáticamente al enviar."
      />
      <IncidenciaForm estructura={estructura} alumnosPorSeccion={alumnosPorSeccion} motivos={motivos} />
    </>
  );
}
