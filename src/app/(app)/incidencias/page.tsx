import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMatriculasPorAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { FiltrosLista } from "@/components/filtros-lista";
import { TablaIncidencias, type IncidenciaFila } from "@/components/tabla-incidencias";
import { Button } from "@/components/ui/button";

const ESTADOS = [
  { value: "nueva", label: "Nueva" },
  { value: "en_revision", label: "En revisión" },
  { value: "derivada", label: "Derivada a caso" },
  { value: "cerrada", label: "Cerrada" },
];
const PRIORIDADES = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
];

export default async function IncidenciasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; prioridad?: string }>;
}) {
  const usuario = await requireUsuario(["profesor"]);
  const { q, estado, prioridad } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("incidencias")
    .select("id, alumno_id, prioridad, estado, fecha_hora, alumnos(nombres, apellidos), catalogo_motivos(nombre)")
    .eq("profesor_id", usuario.id)
    .order("fecha_hora", { ascending: false });

  if (estado) query = query.eq("estado", estado);
  if (prioridad) query = query.eq("prioridad", prioridad);

  const { data } = await query;
  let incidencias = (data ?? []) as unknown as IncidenciaFila[];

  if (q) {
    const needle = q.toLowerCase();
    incidencias = incidencias.filter((i) =>
      `${i.alumnos?.nombres ?? ""} ${i.alumnos?.apellidos ?? ""}`.toLowerCase().includes(needle),
    );
  }

  const matriculas = await getMatriculasPorAlumno(supabase);

  return (
    <>
      <PageHeader
        eyebrow="Incidencias"
        title="Mis incidencias"
        description="Incidencias que has reportado. Una vez enviadas, quedan fijas."
        actions={
          <Button
            render={
              <Link href="/incidencias/nueva">
                <Plus className="size-4" />
                Reportar incidencia
              </Link>
            }
          />
        }
      />

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <FiltrosLista
          action="/incidencias"
          q={q}
          selects={[
            { name: "estado", value: estado, placeholder: "Todos los estados", options: ESTADOS },
            { name: "prioridad", value: prioridad, placeholder: "Toda prioridad", options: PRIORIDADES },
          ]}
        />
        <TablaIncidencias incidencias={incidencias} matriculas={matriculas} />
      </div>
    </>
  );
}
