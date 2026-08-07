import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { nombreAlumno } from "@/lib/queries";
import { construirMotivoDesdeIncidencia } from "@/lib/resumen-incidencia";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ActaAlumnoForm } from "./acta-alumno-form";

export default async function ActaAlumnoNuevaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();

  const { data: caso } = await supabase
    .from("casos")
    .select("id, incidencia_id, alumnos(nombres, apellidos)")
    .eq("id", id)
    .maybeSingle();

  if (!caso) notFound();
  const alumno = caso.alumnos as unknown as { nombres: string; apellidos: string };

  let motivoSugerido: string | undefined;
  if (caso.incidencia_id) {
    const { data: inc } = await supabase
      .from("incidencias")
      .select(
        "fecha_hora, descripcion, acciones_tomadas, involucrados, prioridad, motivo_otro, catalogo_motivos(nombre), usuarios!incidencias_profesor_id_fkey(nombre)",
      )
      .eq("id", caso.incidencia_id)
      .maybeSingle();

    if (inc) {
      motivoSugerido = construirMotivoDesdeIncidencia({
        fechaHora: inc.fecha_hora,
        profesorNombre: (inc.usuarios as unknown as { nombre: string } | null)?.nombre ?? "—",
        motivo: inc.motivo_otro || (inc.catalogo_motivos as unknown as { nombre: string } | null)?.nombre || "—",
        prioridad: inc.prioridad,
        descripcion: inc.descripcion,
        accionesTomadas: inc.acciones_tomadas,
        involucrados: inc.involucrados,
      });
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        render={
          <Link href={`/casos/${id}`}>
            <ArrowLeft className="size-4" />
            Volver al caso
          </Link>
        }
      />
      <PageHeader
        eyebrow="Sesión individual"
        title="Registrar acta con el alumno"
        description="A diferencia del acta de reunión con padres, aquí solo firma el alumno."
      />
      <ActaAlumnoForm
        casoId={id}
        alumnoNombre={nombreAlumno(alumno)}
        psicologoNombre={usuario.nombre}
        motivoSugerido={motivoSugerido}
      />
    </>
  );
}
