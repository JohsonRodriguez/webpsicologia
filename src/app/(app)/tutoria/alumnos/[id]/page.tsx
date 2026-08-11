import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMatriculasPorAlumno, nombreAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { TablaIncidencias, type IncidenciaFila } from "@/components/tabla-incidencias";

export default async function TutoriaAlumnoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUsuario(["profesor"]);
  const supabase = await createClient();

  const { data: alumno } = await supabase.from("alumnos").select("id, nombres, apellidos, codigo").eq("id", id).maybeSingle();
  if (!alumno) notFound();

  // Sin chequeo manual de aula: la policy RLS "tutor ve incidencias de su
  // aula" ya deja esta consulta vacía si el alumno no es de tu tutoría (y
  // no reportaste tú mismo alguna incidencia sobre él).
  const { data } = await supabase
    .from("incidencias")
    .select("id, alumno_id, prioridad, estado, fecha_hora, motivo_otro, alumnos(nombres, apellidos), catalogo_motivos(nombre), usuarios(nombre)")
    .eq("alumno_id", id)
    .order("fecha_hora", { ascending: false });
  const incidencias = (data ?? []) as unknown as IncidenciaFila[];

  const matriculas = await getMatriculasPorAlumno(supabase, undefined, [id]);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        render={
          <Link href="/tutoria/alumnos">
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        }
      />
      <PageHeader
        eyebrow="Tutoría"
        title={nombreAlumno(alumno)}
        description={`Código ${alumno.codigo} · Incidencias registradas por cualquier docente.`}
      />

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <TablaIncidencias incidencias={incidencias} matriculas={matriculas} mostrarProfesor />
      </div>
    </>
  );
}
