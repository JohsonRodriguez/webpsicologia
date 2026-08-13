import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnioActivo, nombreAlumno } from "@/lib/queries";
import { PERIODOS, PERIODO_ACTUAL } from "@/lib/periodos";
import { PageHeader } from "@/components/page-header";
import { PeriodoSelector } from "../periodo-selector";
import { BienestarFiltro, type FilaBienestar } from "../bienestar-filtro";

export default async function MisAlumnosBienestarPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo: periodoParam } = await searchParams;
  const periodo = PERIODOS.includes(periodoParam as (typeof PERIODOS)[number]) ? periodoParam! : PERIODO_ACTUAL;

  const usuario = await requireUsuario(["coordinador_bienestar"]);
  const supabase = await createClient();

  // Sin filtro de coordinador_id: la policy RLS "coordinador ve sus
  // reuniones de bienestar" ya limita las filas a las suyas.
  const reunionesPromise = supabase
    .from("reuniones_bienestar")
    .select("id, alumno_id, estado")
    .eq("periodo", periodo);

  const [anioActivo, { data: asignaciones }] = await Promise.all([
    getAnioActivo(supabase),
    supabase.from("coordinador_nivel").select("nivel_id, niveles(nombre)").eq("usuario_id", usuario.id),
  ]);

  const nivelIds = (asignaciones ?? []).map((a) => a.nivel_id);
  const nombresNiveles = (asignaciones ?? [])
    .map((a) => (a.niveles as unknown as { nombre: string } | null)?.nombre)
    .filter(Boolean)
    .join(", ");

  const { data: grados } = nivelIds.length
    ? await supabase.from("grados").select("id, nombre, nivel_id").in("nivel_id", nivelIds)
    : { data: [] };
  const gradoIds = (grados ?? []).map((g) => g.id);
  const gradoPorId = new Map((grados ?? []).map((g) => [g.id, g.nombre]));

  const { data: matriculas } = gradoIds.length
    ? await supabase
        .from("matriculas")
        .select("alumno_id, grado_id, seccion_id, alumnos(nombres, apellidos), secciones(nombre)")
        .in("grado_id", gradoIds)
        .eq("anio_academico_id", anioActivo?.id ?? "")
    : { data: [] };

  const { data: reuniones } = await reunionesPromise;
  const reunionPorAlumno = new Map((reuniones ?? []).map((r) => [r.alumno_id, r]));

  const filas: FilaBienestar[] = (matriculas ?? []).map((m) => {
    const alumno = m.alumnos as unknown as { nombres: string; apellidos: string } | null;
    const seccion = m.secciones as unknown as { nombre: string } | null;
    const reunion = reunionPorAlumno.get(m.alumno_id);
    return {
      alumnoId: m.alumno_id,
      nombre: alumno ? nombreAlumno(alumno) : "—",
      gradoId: m.grado_id,
      gradoNombre: gradoPorId.get(m.grado_id) ?? "",
      seccionId: m.seccion_id,
      seccionNombre: seccion?.nombre ?? "",
      estado: reunion?.estado === "concluida" ? ("concluida" as const) : ("pendiente" as const),
      reunionId: reunion?.id,
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Bienestar Familiar"
        title="Mis alumnos"
        description={
          nivelIds.length > 0
            ? `Nivel(es) asignado(s): ${nombresNiveles}.`
            : "No tienes ningún nivel asignado todavía."
        }
        actions={<PeriodoSelector seleccionado={periodo} />}
      />

      <BienestarFiltro filas={filas} periodo={periodo} />
    </>
  );
}
