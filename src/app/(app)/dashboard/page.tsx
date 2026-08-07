import Link from "next/link";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMatriculasPorAlumno, nombreAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { BarChart, DonutChart, Legend } from "@/components/charts";
import { PillEstadoIncidencia, BarraPrioridad } from "@/components/status-pills";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableRow } from "@/components/clickable-row";

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="font-heading text-3xl">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const usuario = await requireUsuario(["psicologo", "jefe_psicologia"]);
  const esJefe = usuario.rol === "jefe_psicologia";
  const supabase = await createClient();

  let casosQuery = supabase.from("casos").select("id, estado, alumno_id");
  let incQuery = supabase
    .from("incidencias")
    .select(
      "id, alumno_id, prioridad, estado, fecha_hora, motivo_otro, alumnos(nombres, apellidos), catalogo_motivos(nombre)",
    )
    .order("fecha_hora", { ascending: false });

  if (!esJefe) {
    casosQuery = casosQuery.eq("psicologo_id", usuario.id);
  }

  const [{ data: casos }, { data: incidencias }] = await Promise.all([casosQuery, incQuery]);

  const casosList = casos ?? [];
  const incidenciasList = (incidencias ?? []).slice(0, 5);
  const todasIncidencias = incidencias ?? [];

  const porEstado = {
    abierto: casosList.filter((c) => c.estado === "abierto").length,
    en_atencion: casosList.filter((c) => c.estado === "en_atencion").length,
    derivado: casosList.filter((c) => c.estado === "derivado").length,
    cerrado: casosList.filter((c) => c.estado === "cerrado").length,
  };
  const pendientesInc = todasIncidencias.filter((i) => i.estado === "nueva" || i.estado === "en_revision").length;

  const matriculas = await getMatriculasPorAlumno(supabase);

  return (
    <>
      <PageHeader
        eyebrow={esJefe ? "Jefatura de psicología" : "Panorama"}
        title={esJefe ? "Dashboard general del colegio" : "Dashboard"}
        description={
          esJefe
            ? "Métricas agregadas de los 4 psicólogos del equipo."
            : "Resumen de tus casos e incidencias asignadas."
        }
      />

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatTile label="Casos totales" value={casosList.length} />
        <StatTile label="En atención" value={porEstado.en_atencion} />
        <StatTile label="Cerrados" value={porEstado.cerrado} />
        <StatTile label="Incidencias pendientes" value={pendientesInc} />
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-4">
            <h3 className="font-heading text-base font-semibold">Casos por estado</h3>
          </div>
          <div className="flex flex-wrap items-center gap-6 p-4">
            <DonutChart
              data={[
                { label: "Abierto", value: porEstado.abierto, color: "var(--info)" },
                { label: "En atención", value: porEstado.en_atencion, color: "var(--warn)" },
                { label: "Derivado", value: porEstado.derivado, color: "var(--primary)" },
                { label: "Cerrado", value: porEstado.cerrado, color: "var(--good)" },
              ]}
            />
            <Legend
              items={[
                { label: "Abierto", value: porEstado.abierto, color: "var(--info)" },
                { label: "En atención", value: porEstado.en_atencion, color: "var(--warn)" },
                { label: "Derivado", value: porEstado.derivado, color: "var(--primary)" },
                { label: "Cerrado", value: porEstado.cerrado, color: "var(--good)" },
              ]}
            />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-4">
            <h3 className="font-heading text-base font-semibold">Incidencias por prioridad</h3>
          </div>
          <div className="p-4">
            <BarChart
              data={[
                { label: "Baja", value: todasIncidencias.filter((i) => i.prioridad === "baja").length, color: "var(--good)" },
                { label: "Media", value: todasIncidencias.filter((i) => i.prioridad === "media").length, color: "var(--warn)" },
                { label: "Alta", value: todasIncidencias.filter((i) => i.prioridad === "alta").length, color: "var(--critical)" },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-heading text-base font-semibold">Últimos reportes</h3>
          <Link href={esJefe ? "/todas" : "/casos"} className="text-sm font-medium text-primary hover:underline">
            Ver todas
          </Link>
        </div>
        {incidenciasList.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">Sin reportes recientes.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-4"></TableHead>
                <TableHead>Alumno</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidenciasList.map((i) => {
                const mat = matriculas.get(i.alumno_id);
                const alumno = i.alumnos as unknown as { nombres: string; apellidos: string } | null;
                return (
                  <ClickableRow key={i.id} href={`/incidencias/${i.id}`}>
                    <TableCell>
                      <BarraPrioridad prioridad={i.prioridad} />
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{alumno ? nombreAlumno(alumno) : "—"}</div>
                      <div className="text-xs text-muted-foreground">{mat ? mat.gradoNombre : ""}</div>
                    </TableCell>
                    <TableCell>
                      {i.motivo_otro || (i.catalogo_motivos as unknown as { nombre: string } | null)?.nombre}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {new Date(i.fecha_hora).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                    </TableCell>
                    <TableCell>
                      <PillEstadoIncidencia estado={i.estado} />
                    </TableCell>
                  </ClickableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}
