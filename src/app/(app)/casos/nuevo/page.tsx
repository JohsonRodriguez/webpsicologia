import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnioActivo } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { NuevoCasoForm } from "./nuevo-caso-form";

export default async function NuevoCasoPage() {
  const usuario = await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();

  let alumnos: { id: string; nombres: string; apellidos: string; codigo: string }[] = [];

  if (usuario.rol === "jefe_psicologia") {
    const { data } = await supabase.from("alumnos").select("id, nombres, apellidos, codigo").order("apellidos");
    alumnos = data ?? [];
  } else {
    const anioActivo = await getAnioActivo(supabase);
    const { data: grados } = await supabase.from("psicologo_grado").select("grado_id").eq("usuario_id", usuario.id);
    const gradoIds = (grados ?? []).map((g) => g.grado_id);
    const { data } = await supabase
      .from("matriculas")
      .select("alumnos(id, nombres, apellidos, codigo)")
      .eq("anio_academico_id", anioActivo?.id ?? "")
      .in("grado_id", gradoIds.length ? gradoIds : ["00000000-0000-0000-0000-000000000000"]);
    alumnos = (data ?? [])
      .map((m) => m.alumnos as unknown as { id: string; nombres: string; apellidos: string; codigo: string } | null)
      .filter((a): a is { id: string; nombres: string; apellidos: string; codigo: string } => !!a)
      .sort((a, b) => a.apellidos.localeCompare(b.apellidos));
  }

  return (
    <>
      <PageHeader
        eyebrow="Caso directo"
        title="Abrir caso de seguimiento"
        description="Registra un caso sin una incidencia previa, a partir de tu propia observación."
      />
      <NuevoCasoForm alumnos={alumnos ?? []} />
    </>
  );
}
