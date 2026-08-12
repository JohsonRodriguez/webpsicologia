import { notFound } from "next/navigation";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnioActivo, nombreAlumno } from "@/lib/queries";
import { PERIODOS, PERIODO_ACTUAL } from "@/lib/periodos";
import { PageHeader } from "@/components/page-header";
import { ReunionBienestarForm } from "./reunion-bienestar-form";

export default async function NuevaReunionBienestarPage({
  searchParams,
}: {
  searchParams: Promise<{ alumno?: string; periodo?: string }>;
}) {
  const { alumno: alumnoId, periodo: periodoParam } = await searchParams;
  await requireUsuario(["coordinador_bienestar"]);
  const supabase = await createClient();

  if (!alumnoId) notFound();

  const { data: alumno } = await supabase.from("alumnos").select("id, nombres, apellidos, codigo").eq("id", alumnoId).maybeSingle();
  if (!alumno) notFound();

  const anioActivo = await getAnioActivo(supabase);
  const periodo = PERIODOS.includes(periodoParam as (typeof PERIODOS)[number]) ? periodoParam! : PERIODO_ACTUAL;

  return (
    <>
      <PageHeader
        eyebrow="Bienestar Familiar"
        title="Registrar reunión"
        description={`${nombreAlumno(alumno)} · ${alumno.codigo}`}
      />
      <ReunionBienestarForm
        alumnoId={alumno.id}
        anioAcademicoId={anioActivo?.id ?? ""}
        periodoInicial={periodo}
      />
    </>
  );
}
