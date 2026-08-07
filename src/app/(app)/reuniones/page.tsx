import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMatriculasPorAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { ReunionesFiltro, type FilaReunion } from "./reuniones-filtro";

export default async function ReunionesPage() {
  const usuario = await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();

  const { data: citas } = await supabase
    .from("citas_padres")
    .select(
      "id, fecha, hora, detalle, caso_id, casos!inner(psicologo_id, alumno_id, alumnos(nombres, apellidos)), firmas(id)",
    )
    .eq("casos.psicologo_id", usuario.id)
    .order("fecha", { ascending: false });

  const matriculas = await getMatriculasPorAlumno(supabase);

  const filas: FilaReunion[] = (citas ?? []).map((r) => {
    const caso = r.casos as unknown as {
      alumno_id: string;
      alumnos: { nombres: string; apellidos: string } | null;
    };
    const mat = matriculas.get(caso.alumno_id);
    return {
      id: r.id,
      casoId: r.caso_id,
      fecha: r.fecha,
      hora: r.hora,
      nombres: caso.alumnos?.nombres ?? "",
      apellidos: caso.alumnos?.apellidos ?? "",
      firmada: (r.firmas?.length ?? 0) >= 1,
      nivelId: mat?.nivelId ?? "",
      nivelNombre: mat?.nivelNombre ?? "—",
      gradoId: mat?.gradoId ?? "",
      gradoNombre: mat?.gradoNombre ?? "",
      seccionId: mat?.seccionId ?? "",
      seccionNombre: mat?.seccionNombre ?? "",
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Psicología"
        title="Reuniones con padres"
        description="Actas de reunión registradas en tus casos, agendadas y documentadas aquí. La cita en sí se coordina en SIANET. Filtra por nivel, grado y sección."
      />
      <ReunionesFiltro filas={filas} />
    </>
  );
}
