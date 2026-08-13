import Link from "next/link";
import { FolderOpen, Clock, CheckCircle2, TriangleAlert, ChartPie, ListTodo, Plus, ArrowRight, Users } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMatriculasPorAlumno, nombreAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { DonutChart, Legend } from "@/components/charts";
import { PillEstadoCaso } from "@/components/status-pills";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableRow } from "@/components/clickable-row";
import { NuevasIncidenciasToast } from "./nuevas-incidencias-toast";

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
  href,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tono: keyof typeof TONO;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow duration-150 ease-(--ease-out) hover:shadow-md focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.98]"
    >
      <div className={`flex size-11 flex-none items-center justify-center rounded-lg ${TONO[tono]}`}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="font-heading text-2xl leading-none font-bold">{value}</p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </Link>
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
      <div className="flex items-center gap-1.5 border-b border-border p-4 text-primary">
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

  const camposCaso = "id, estado, alumno_id, fecha_apertura, alumnos(nombres, apellidos)";

  // Conteos por estado: solo se trae la columna `estado` (sin joins) en vez de
  // filas completas, y las listas de "recientes"/"pendientes" se acotan a 5
  // filas en la propia consulta en vez de traer todos los casos y recortar en JS.
  let estadosQuery = supabase.from("casos").select("estado");
  let recientesQuery = supabase.from("casos").select(camposCaso).order("fecha_apertura", { ascending: false }).limit(5);
  let pendientesQuery = supabase
    .from("casos")
    .select(camposCaso)
    .neq("estado", "cerrado")
    .order("fecha_apertura", { ascending: false })
    .limit(5);

  if (!esJefe) {
    estadosQuery = estadosQuery.eq("psicologo_id", usuario.id);
    recientesQuery = recientesQuery.eq("psicologo_id", usuario.id);
    pendientesQuery = pendientesQuery.eq("psicologo_id", usuario.id);
  }

  const [
    { data: estados },
    { data: recientesData },
    { data: pendientesData },
    { count: countInc },
    { count: countNuevas },
    { data: incidenciasPorAlumno },
  ] = await Promise.all([
    estadosQuery,
    recientesQuery,
    pendientesQuery,
    supabase
      .from("incidencias")
      .select("id", { count: "exact", head: true })
      .in("estado", ["nueva", "en_revision"]),
    supabase.from("incidencias").select("id", { count: "exact", head: true }).eq("estado", "nueva"),
    // Sin .in() por alumno: la policy RLS de incidencias ya limita las filas a
    // los alumnos del grado del psicólogo (o a todas para jefatura), así que
    // basta con contar en JS cuántas veces aparece cada alumno_id. No depende
    // de las consultas de arriba, así que va en la misma tanda.
    supabase.from("incidencias").select("alumno_id"),
  ]);

  const estadosList = estados ?? [];
  const casosRecientes = recientesData ?? [];
  const casosPendientes = pendientesData ?? [];
  const pendientesInc = countInc ?? 0;
  const nuevasInc = countNuevas ?? 0;
  const porEstado = {
    abierto: estadosList.filter((c) => c.estado === "abierto").length,
    en_atencion: estadosList.filter((c) => c.estado === "en_atencion").length,
    derivado: estadosList.filter((c) => c.estado === "derivado").length,
    cerrado: estadosList.filter((c) => c.estado === "cerrado").length,
  };

  const conteoIncidencias = new Map<string, number>();
  for (const i of incidenciasPorAlumno ?? []) {
    conteoIncidencias.set(i.alumno_id, (conteoIncidencias.get(i.alumno_id) ?? 0) + 1);
  }
  const top5AlumnoIds = [...conteoIncidencias.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const alumnoIds = [
    ...new Set([...casosRecientes, ...casosPendientes].map((c) => c.alumno_id).concat(top5AlumnoIds.map(([id]) => id))),
  ];

  // Ninguna depende de la otra: van juntas.
  const [{ data: alumnosTop5 }, matriculas] = await Promise.all([
    top5AlumnoIds.length
      ? supabase
          .from("alumnos")
          .select("id, nombres, apellidos")
          .in(
            "id",
            top5AlumnoIds.map(([id]) => id),
          )
      : Promise.resolve({ data: [] }),
    getMatriculasPorAlumno(supabase, undefined, alumnoIds),
  ]);

  const topAlumnosIncidencias = top5AlumnoIds.map(([alumnoId, total]) => {
    const alumno = (alumnosTop5 ?? []).find((a) => a.id === alumnoId);
    const mat = matriculas.get(alumnoId);
    return {
      alumnoId,
      nombre: alumno ? nombreAlumno(alumno) : "—",
      gradoNombre: mat?.gradoNombre ?? "",
      seccionNombre: mat?.seccionNombre ?? "",
      total,
    };
  });

  const primerNombre = usuario.nombre.split(" ")[0];

  return (
    <>
      <NuevasIncidenciasToast cantidad={nuevasInc} href={esJefe ? "/todas?tab=incidencias&estado=nueva" : "/casos?tab=incidencias&estado=nueva"} />
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
        <StatTile
          label="Casos totales"
          value={estadosList.length}
          icon={FolderOpen}
          tono="primary"
          href={esJefe ? "/todas?tab=casos" : "/casos"}
        />
        <StatTile
          label="En atención"
          value={porEstado.en_atencion}
          icon={Clock}
          tono="warn"
          href={esJefe ? "/todas?tab=casos&estado=en_atencion" : "/casos?estado=en_atencion"}
        />
        <StatTile
          label="Cerrados"
          value={porEstado.cerrado}
          icon={CheckCircle2}
          tono="good"
          href={esJefe ? "/todas?tab=casos&estado=cerrado" : "/casos?estado=cerrado"}
        />
        <StatTile
          label="Incidencias pendientes"
          value={pendientesInc}
          icon={TriangleAlert}
          tono="critical"
          href={esJefe ? "/todas?tab=incidencias" : "/casos?tab=incidencias"}
        />
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
        <CardChart icon={ListTodo} titulo="Actividades pendientes">
          {casosPendientes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes casos pendientes.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {casosPendientes.map((c) => {
                const alumno = c.alumnos as unknown as { nombres: string; apellidos: string } | null;
                return (
                  <Link
                    key={c.id}
                    href={`/casos/${c.id}`}
                    className="flex items-center justify-between gap-3.5 py-2.5 first:pt-0 last:pb-0 transition-colors duration-150 ease-(--ease-out) hover:text-primary"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex size-8 flex-none items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {alumno ? iniciales(nombreAlumno(alumno)) : "—"}
                      </div>
                      <span className="truncate text-sm font-medium">{alumno ? nombreAlumno(alumno) : "—"}</span>
                    </div>
                    <PillEstadoCaso estado={c.estado} />
                  </Link>
                );
              })}
            </div>
          )}
        </CardChart>
      </div>

      <CardChart icon={Users} titulo={esJefe ? "Alumnos con más incidencias (todo el colegio)" : "Tus alumnos con más incidencias"}>
        {topAlumnosIncidencias.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin incidencias registradas todavía.</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {topAlumnosIncidencias.map((a) => (
              <Link
                key={a.alumnoId}
                href={`/alumnos/${a.alumnoId}`}
                className="flex items-center justify-between gap-3.5 py-2.5 first:pt-0 last:pb-0 transition-colors duration-150 ease-(--ease-out) hover:text-primary"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex size-8 flex-none items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {iniciales(a.nombre)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{a.nombre}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.gradoNombre} &quot;{a.seccionNombre}&quot;
                    </div>
                  </div>
                </div>
                <span className="inline-flex flex-none items-center rounded-full bg-critical-soft px-2.5 py-1 text-xs font-bold text-critical">
                  {a.total} {a.total === 1 ? "incidencia" : "incidencias"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardChart>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-heading text-base font-semibold">Últimos casos</h3>
          <Link
            href={esJefe ? "/todas" : "/casos"}
            className="flex items-center gap-1.5 text-sm font-medium text-primary transition-colors duration-150 ease-(--ease-out) hover:underline"
          >
            Ver todas
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {casosRecientes.length === 0 ? (
          <div className="p-4">
            <p className="text-sm text-muted-foreground">Sin casos recientes.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Alumno</TableHead>
                <TableHead>Fecha de apertura</TableHead>
                <TableHead className="pr-4">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {casosRecientes.map((c) => {
                const mat = matriculas.get(c.alumno_id);
                const alumno = c.alumnos as unknown as { nombres: string; apellidos: string } | null;
                return (
                  <ClickableRow key={c.id} href={`/casos/${c.id}`}>
                    <TableCell className="pl-4">
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
                    <TableCell className="tabular-nums text-muted-foreground">
                      {new Date(c.fecha_apertura).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                    </TableCell>
                    <TableCell className="pr-4">
                      <PillEstadoCaso estado={c.estado} />
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
