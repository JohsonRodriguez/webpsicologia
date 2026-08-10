import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMatriculasPorAlumno, rangoPagina, totalPaginas, filtroNombreAlumno } from "@/lib/queries";
import { construirQuery } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { FiltrosLista } from "@/components/filtros-lista";
import { UrlTabs } from "@/components/url-tabs";
import { Paginacion } from "@/components/paginacion";
import { TablaIncidencias, type IncidenciaFila } from "@/components/tabla-incidencias";
import { TablaCasos, type CasoFila } from "@/components/tabla-casos";
import { Button } from "@/components/ui/button";

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

export default async function CasosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; estado?: string; page?: string }>;
}) {
  const usuario = await requireUsuario(["psicologo", "jefe_psicologia"]);
  const { tab = "incidencias", q, estado, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const supabase = await createClient();
  const matriculas = await getMatriculasPorAlumno(supabase);

  return (
    <>
      <PageHeader
        eyebrow="Seguimiento"
        title="Mis casos e incidencias"
        description="Casos que tienes a cargo, abiertos desde una incidencia o directamente."
        actions={
          <Button
            render={
              <Link href="/casos/nuevo">
                <Plus className="size-4" />
                Abrir caso directo
              </Link>
            }
          />
        }
      />

      <UrlTabs
        active={tab}
        tabs={[
          { key: "incidencias", label: "Incidencias", href: "/casos?tab=incidencias" },
          { key: "casos", label: "Casos", href: "/casos?tab=casos" },
        ]}
      />

      <div className="rounded-xl border border-border bg-card shadow-sm">
        {tab === "incidencias" ? (
          <IncidenciasTab q={q} estado={estado} page={page} matriculas={matriculas} />
        ) : (
          <CasosTab usuarioId={usuario.id} q={q} estado={estado} page={page} matriculas={matriculas} />
        )}
      </div>
    </>
  );
}

async function CasosTab({
  usuarioId,
  q,
  estado,
  page,
  matriculas,
}: {
  usuarioId: string;
  q?: string;
  estado?: string;
  page: number;
  matriculas: Awaited<ReturnType<typeof getMatriculasPorAlumno>>;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("casos")
    .select(
      "id, alumno_id, tipo, estado, fecha_apertura, psicologo_id, psicologo_original_id, alumnos!inner(nombres, apellidos), usuarios!casos_psicologo_id_fkey(nombre)",
      { count: "exact" },
    )
    .eq("psicologo_id", usuarioId)
    .order("fecha_apertura", { ascending: false });

  if (estado) query = query.eq("estado", estado);
  if (q) query = query.or(filtroNombreAlumno(q), { foreignTable: "alumnos" });

  const { from, to } = rangoPagina(page);
  const { data, count } = await query.range(from, to);
  const casos = (data ?? []) as unknown as CasoFila[];
  const totalPages = totalPaginas(count);

  return (
    <>
      <FiltrosLista
        action="/casos"
        q={q}
        hidden={{ tab: "casos" }}
        selects={[{ name: "estado", value: estado, placeholder: "Todos los estados", options: ESTADOS_CASO }]}
      />
      <TablaCasos casos={casos} matriculas={matriculas} />
      <Paginacion
        page={Math.min(page, totalPages)}
        totalPages={totalPages}
        hrefPagina={(p) => `/casos${construirQuery({ tab: "casos", q, estado, page: p })}`}
      />
    </>
  );
}

async function IncidenciasTab({
  q,
  estado,
  page,
  matriculas,
}: {
  q?: string;
  estado?: string;
  page: number;
  matriculas: Awaited<ReturnType<typeof getMatriculasPorAlumno>>;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("incidencias")
    .select(
      "id, alumno_id, prioridad, estado, fecha_hora, motivo_otro, alumnos!inner(nombres, apellidos), catalogo_motivos(nombre)",
      { count: "exact" },
    )
    .order("fecha_hora", { ascending: false });

  if (estado) query = query.eq("estado", estado);
  if (q) query = query.or(filtroNombreAlumno(q), { foreignTable: "alumnos" });

  const { from, to } = rangoPagina(page);
  const { data, count } = await query.range(from, to);
  const incidencias = (data ?? []) as unknown as IncidenciaFila[];
  const totalPages = totalPaginas(count);

  return (
    <>
      <FiltrosLista
        action="/casos"
        q={q}
        hidden={{ tab: "incidencias" }}
        selects={[{ name: "estado", value: estado, placeholder: "Todos los estados", options: ESTADOS_INC }]}
      />
      <TablaIncidencias incidencias={incidencias} matriculas={matriculas} baseHref="/incidencias" />
      <Paginacion
        page={Math.min(page, totalPages)}
        totalPages={totalPages}
        hrefPagina={(p) => `/casos${construirQuery({ tab: "incidencias", q, estado, page: p })}`}
      />
    </>
  );
}
