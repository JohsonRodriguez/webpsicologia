import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMatriculasPorAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { FiltrosLista } from "@/components/filtros-lista";
import { UrlTabs } from "@/components/url-tabs";
import { TablaIncidencias, type IncidenciaFila } from "@/components/tabla-incidencias";
import { TablaCasos, type CasoFila } from "@/components/tabla-casos";

const ESTADOS_CASO = [
  { value: "abierto", label: "Abierto" },
  { value: "en_atencion", label: "En atención" },
  { value: "derivado", label: "Derivado" },
  { value: "cerrado", label: "Cerrado" },
];
const ESTADOS_INC = [
  { value: "nueva", label: "Nueva" },
  { value: "en_revision", label: "En revisión" },
  { value: "derivada", label: "Derivada a caso" },
  { value: "cerrada", label: "Cerrada" },
];

export default async function TodasPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; estado?: string }>;
}) {
  await requireUsuario(["jefe_psicologia"]);
  const { tab = "incidencias", q, estado } = await searchParams;
  const supabase = await createClient();
  const matriculas = await getMatriculasPorAlumno(supabase);

  let incidencias: IncidenciaFila[] = [];
  let casos: CasoFila[] = [];

  if (tab === "casos") {
    let query = supabase
      .from("casos")
      .select(
        "id, alumno_id, tipo, estado, fecha_apertura, psicologo_id, psicologo_original_id, alumnos(nombres, apellidos), usuarios!casos_psicologo_id_fkey(nombre)",
      )
      .order("fecha_apertura", { ascending: false });
    if (estado) query = query.eq("estado", estado);
    const { data } = await query;
    casos = (data ?? []) as unknown as CasoFila[];
    if (q) {
      const needle = q.toLowerCase();
      casos = casos.filter((c) => `${c.alumnos?.nombres ?? ""} ${c.alumnos?.apellidos ?? ""}`.toLowerCase().includes(needle));
    }
  } else {
    let query = supabase
      .from("incidencias")
      .select(
        "id, alumno_id, prioridad, estado, fecha_hora, alumnos(nombres, apellidos), catalogo_motivos(nombre), usuarios!incidencias_profesor_id_fkey(nombre)",
      )
      .order("fecha_hora", { ascending: false });
    if (estado) query = query.eq("estado", estado);
    const { data } = await query;
    incidencias = (data ?? []) as unknown as IncidenciaFila[];
    if (q) {
      const needle = q.toLowerCase();
      incidencias = incidencias.filter((i) =>
        `${i.alumnos?.nombres ?? ""} ${i.alumnos?.apellidos ?? ""}`.toLowerCase().includes(needle),
      );
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Jefatura"
        title="Todas las incidencias y casos"
        description="Vista de jefatura: todo lo reportado en el colegio, con trazabilidad de derivaciones."
      />

      <UrlTabs
        active={tab}
        tabs={[
          { key: "incidencias", label: "Incidencias", href: "/todas?tab=incidencias" },
          { key: "casos", label: "Casos", href: "/todas?tab=casos" },
        ]}
      />

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <FiltrosLista
          action="/todas"
          q={q}
          hidden={{ tab }}
          selects={[
            {
              name: "estado",
              value: estado,
              placeholder: "Todos los estados",
              options: tab === "casos" ? ESTADOS_CASO : ESTADOS_INC,
            },
          ]}
        />
        {tab === "casos" ? (
          <TablaCasos casos={casos} matriculas={matriculas} mostrarPsicologo baseHref="/casos" />
        ) : (
          <TablaIncidencias incidencias={incidencias} matriculas={matriculas} mostrarProfesor baseHref="/incidencias" />
        )}
      </div>
    </>
  );
}
