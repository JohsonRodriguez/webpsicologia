import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnioActivo, getEstructuraAcademica, type EstructuraAcademica } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { NuevoCasoForm } from "./nuevo-caso-form";

type AlumnoOpcion = { alumnoId: string; seccionId: string; nombre: string; codigo: string };

export default async function NuevoCasoPage() {
  const usuario = await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();

  const anioActivo = await getAnioActivo(supabase);
  const estructuraCompleta = await getEstructuraAcademica(supabase);

  let estructura: EstructuraAcademica = estructuraCompleta;
  let gradoIds: string[] | null = null;

  if (usuario.rol === "psicologo") {
    const { data: asignaciones } = await supabase
      .from("psicologo_grado")
      .select("grado_id")
      .eq("usuario_id", usuario.id);
    gradoIds = (asignaciones ?? []).map((g) => g.grado_id);

    const grados = estructuraCompleta.grados.filter((g) => gradoIds!.includes(g.id));
    const nivelIds = new Set(grados.map((g) => g.nivel_id));
    estructura = {
      niveles: estructuraCompleta.niveles.filter((n) => nivelIds.has(n.id)),
      grados,
      secciones: estructuraCompleta.secciones.filter((s) => gradoIds!.includes(s.grado_id)),
    };
  }

  const { data: matriculas } = await supabase
    .from("matriculas")
    .select("alumno_id, seccion_id, alumnos(nombres, apellidos, codigo)")
    .eq("anio_academico_id", anioActivo?.id ?? "")
    .in("grado_id", gradoIds ? (gradoIds.length ? gradoIds : ["00000000-0000-0000-0000-000000000000"]) : estructuraCompleta.grados.map((g) => g.id));

  const alumnosPorSeccion: AlumnoOpcion[] = (matriculas ?? []).map((m) => {
    const alumno = m.alumnos as unknown as { nombres: string; apellidos: string; codigo: string } | null;
    return {
      alumnoId: m.alumno_id,
      seccionId: m.seccion_id,
      nombre: `${alumno?.nombres ?? ""} ${alumno?.apellidos ?? ""}`.trim(),
      codigo: alumno?.codigo ?? "",
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Caso directo"
        title="Abrir caso de seguimiento"
        description="Registra un caso sin una incidencia previa, a partir de tu propia observación."
      />
      <NuevoCasoForm estructura={estructura} alumnosPorSeccion={alumnosPorSeccion} />
    </>
  );
}
