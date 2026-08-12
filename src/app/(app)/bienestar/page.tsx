import { HeartHandshake, Users, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnioActivo, nombreAlumno } from "@/lib/queries";
import { PERIODOS, PERIODO_ACTUAL } from "@/lib/periodos";
import { PageHeader } from "@/components/page-header";
import { SeccionCard } from "@/components/detail-ui";
import { HorizontalBarList } from "@/components/charts";
import { PeriodoSelector } from "./periodo-selector";
import { BienestarFiltro, type FilaBienestar } from "./bienestar-filtro";

export default async function BienestarDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const { periodo: periodoParam } = await searchParams;
  const periodo = PERIODOS.includes(periodoParam as (typeof PERIODOS)[number]) ? periodoParam! : PERIODO_ACTUAL;

  const usuario = await requireUsuario(["coordinador_bienestar"]);
  const supabase = await createClient();
  const anioActivo = await getAnioActivo(supabase);

  const { data: asignaciones } = await supabase
    .from("coordinador_nivel")
    .select("nivel_id, niveles(nombre)")
    .eq("usuario_id", usuario.id);

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

  // Sin filtro de coordinador_id: la policy RLS "coordinador ve sus
  // reuniones de bienestar" ya limita las filas a las suyas.
  const { data: reuniones } = await supabase
    .from("reuniones_bienestar")
    .select("id, alumno_id")
    .eq("periodo", periodo);

  const reunionPorAlumno = new Map((reuniones ?? []).map((r) => [r.alumno_id, r.id]));

  const filas: FilaBienestar[] = (matriculas ?? []).map((m) => {
    const alumno = m.alumnos as unknown as { nombres: string; apellidos: string } | null;
    const seccion = m.secciones as unknown as { nombre: string } | null;
    const reunionId = reunionPorAlumno.get(m.alumno_id);
    return {
      alumnoId: m.alumno_id,
      nombre: alumno ? nombreAlumno(alumno) : "—",
      gradoId: m.grado_id,
      gradoNombre: gradoPorId.get(m.grado_id) ?? "",
      seccionId: m.seccion_id,
      seccionNombre: seccion?.nombre ?? "",
      estado: reunionId ? ("concluida" as const) : ("pendiente" as const),
      reunionId,
    };
  });

  const totalAlumnos = filas.length;
  const concluidas = filas.filter((f) => f.estado === "concluida").length;
  const pendientes = totalAlumnos - concluidas;
  const avance = totalAlumnos > 0 ? Math.round((concluidas / totalAlumnos) * 100) : 0;

  const porSeccion = new Map<string, { total: number; concluidas: number }>();
  for (const f of filas) {
    const key = `${f.gradoNombre} "${f.seccionNombre}"`;
    const actual = porSeccion.get(key) ?? { total: 0, concluidas: 0 };
    actual.total += 1;
    if (f.estado === "concluida") actual.concluidas += 1;
    porSeccion.set(key, actual);
  }
  const datosGrafico = [...porSeccion.entries()]
    .map(([label, v]) => ({ label, value: v.total > 0 ? Math.round((v.concluidas / v.total) * 100) : 0 }))
    .sort((a, b) => b.value - a.value);

  return (
    <>
      <PageHeader
        eyebrow="Bienestar Familiar"
        title="Dashboard"
        description={
          nivelIds.length > 0
            ? `Nivel(es) asignado(s): ${nombresNiveles}.`
            : "No tienes ningún nivel asignado todavía."
        }
        actions={<PeriodoSelector seleccionado={periodo} />}
      />

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <div className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="size-5" />
          </div>
          <div>
            <p className="font-heading text-2xl leading-none font-bold">{totalAlumnos}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">Alumnos de mi nivel</p>
          </div>
        </div>
        <div className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-warn-soft text-warn">
            <Clock className="size-5" />
          </div>
          <div>
            <p className="font-heading text-2xl leading-none font-bold">{pendientes}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">Pendientes</p>
          </div>
        </div>
        <div className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-good-soft text-good">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <p className="font-heading text-2xl leading-none font-bold">{concluidas}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">Concluidas</p>
          </div>
        </div>
        <div className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-info-soft text-info">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <p className="font-heading text-2xl leading-none font-bold">{avance}%</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">Avance de {periodo}</p>
          </div>
        </div>
      </div>

      <SeccionCard icon={HeartHandshake} titulo={`% de padres atendidos por sección — ${periodo}`}>
        {datosGrafico.length > 0 ? (
          <HorizontalBarList data={datosGrafico} />
        ) : (
          <p className="text-sm text-muted-foreground">Sin alumnos en tu nivel todavía.</p>
        )}
      </SeccionCard>

      <BienestarFiltro filas={filas} periodo={periodo} />
    </>
  );
}
