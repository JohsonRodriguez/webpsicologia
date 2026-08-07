import Link from "next/link";
import { FolderOpen, Clock, CheckCircle2, TriangleAlert, ChartPie, BarChart3, Plus, ArrowRight } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMatriculasPorAlumno, nombreAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { BarChart, DonutChart, Legend } from "@/components/charts";
import { PillEstadoIncidencia, BarraPrioridad } from "@/components/status-pills";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableRow } from "@/components/clickable-row";

const TONO: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  warn: "bg-warn-soft text-warn",
  good: "bg-good-soft text-good",
  critical: "bg-critical-soft text-critical",
};

function StatTile({
  label,
  value,
  icon: Icon,
  tono,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tono: keyof typeof TONO;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className={`flex size-11 flex-none items-center justify-center rounded-lg ${TONO[tono]}`}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="font-heading text-2xl leading-none font-bold">{value}</p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function CardChart({
  icon: Icon,
  titulo,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border p-4 text-primary">
        <Icon className="size-4" />
        <h3 className="font-heading text-base font-semibold text-foreground">{titulo}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/);
  return `${partes[0]?.[0] ?? ""}${partes[1]?.[0] ?? ""}`.toUpperCase();
}

function saludo() {
  const hora = Number(
    new Intl.DateTimeFormat("es-PE", { hour: "numeric", hour12: false, timeZone: "America/Lima" }).format(
      new Date(),
    ),
  );
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
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
  const primerNombre = usuario.nombre.split(" ")[0];

  return (
    <>
      <PageHeader
        eyebrow={esJefe ? "Jefatura de psicología" : saludo()}
        title={esJefe ? "Dashboard general del colegio" : `${saludo()}, ${primerNombre}`}
        description={
          esJefe
            ? "Métricas agregadas de los 4 psicólogos del equipo."
            : "Este es el resumen de tus casos e incidencias asignadas."
        }
        actions={
          <Button
            variant="outline"
            render={
              <Link href={esJefe ? "/todas" : "/casos/nuevo"}>
                {esJefe ? <ArrowRight className="size-4" /> : <Plus className="size-4" />}
                {esJefe ? "Ver todas las incidencias" : "Abrir caso directo"}
              </Link>
            }
          />
        }
      />

      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatTile label="Casos totales" value={casosList.length} icon={FolderOpen} tono="primary" />
        <StatTile label="En atención" value={porEstado.en_atencion} icon={Clock} tono="warn" />
        <StatTile label="Cerrados" value={porEstado.cerrado} icon={CheckCircle2} tono="good" />
        <StatTile label="Incidencias pendientes" value={pendientesInc} icon={TriangleAlert} tono="critical" />
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <CardChart icon={ChartPie} titulo="Casos por estado">
          <div className="flex flex-wrap items-center gap-6">
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
        </CardChart>
        <CardChart icon={BarChart3} titulo="Incidencias por prioridad">
          <BarChart
            data={[
              { label: "Baja", value: todasIncidencias.filter((i) => i.prioridad === "baja").length, color: "var(--good)" },
              { label: "Media", value: todasIncidencias.filter((i) => i.prioridad === "media").length, color: "var(--warn)" },
              { label: "Alta", value: todasIncidencias.filter((i) => i.prioridad === "alta").length, color: "var(--critical)" },
            ]}
          />
        </CardChart>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-heading text-base font-semibold">Últimos reportes</h3>
          <Link
            href={esJefe ? "/todas" : "/casos"}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver todas
            <ArrowRight className="size-3.5" />
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
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 flex-none items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {alumno ? iniciales(nombreAlumno(alumno)) : "—"}
                        </div>
                        <div>
                          <div className="font-semibold">{alumno ? nombreAlumno(alumno) : "—"}</div>
                          <div className="text-xs text-muted-foreground">{mat ? mat.gradoNombre : ""}</div>
                        </div>
                      </div>
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
