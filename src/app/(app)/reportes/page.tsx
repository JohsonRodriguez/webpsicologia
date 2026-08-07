import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMatriculasPorAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Users, Layers, TrendingUp, BarChart3 } from "lucide-react";
import { BarChart, DonutChart, Legend, LineChart, HorizontalBarList } from "@/components/charts";

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];

export default async function ReportesPage() {
  await requireUsuario(["jefe_psicologia"]);
  const supabase = await createClient();

  const [{ data: psicologos }, { data: casos }, { data: incidencias }] = await Promise.all([
    supabase.from("usuarios").select("id, nombre").eq("rol", "psicologo").eq("activo", true),
    supabase.from("casos").select("id, alumno_id, psicologo_id"),
    supabase.from("incidencias").select("id, alumno_id, prioridad, fecha_hora"),
  ]);

  const matriculas = await getMatriculasPorAlumno(supabase);

  const porPsicologo = (psicologos ?? [])
    .map((p) => ({
      label: p.nombre.split(" ")[0],
      value: (casos ?? []).filter((c) => c.psicologo_id === p.id).length,
    }))
    .sort((a, b) => b.value - a.value);

  const niveles = ["Inicial", "Primaria", "Secundaria"];
  const porNivel = niveles.map((n, i) => ({
    label: n,
    value: (casos ?? []).filter((c) => matriculas.get(c.alumno_id)?.nivelNombre === n).length,
    color: ["var(--info)", "var(--primary)", "var(--purple)"][i],
  }));

  const conteoPorMes = new Map<string, number>();
  for (const i of incidencias ?? []) {
    const key = i.fecha_hora.slice(0, 7);
    conteoPorMes.set(key, (conteoPorMes.get(key) ?? 0) + 1);
  }
  const porMes = [...conteoPorMes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      label: MESES[Number(key.slice(5, 7)) - 1],
      value,
    }));

  const porPrioridad = [
    { label: "Baja", value: (incidencias ?? []).filter((i) => i.prioridad === "baja").length, color: "var(--good)" },
    { label: "Media", value: (incidencias ?? []).filter((i) => i.prioridad === "media").length, color: "var(--warn)" },
    { label: "Alta", value: (incidencias ?? []).filter((i) => i.prioridad === "alta").length, color: "var(--critical)" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Jefatura"
        title="Reportes y estadísticas"
        description="Carga de trabajo del equipo, distribución por grado, por mes y por prioridad."
      />
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Panel icon={Users} title="Carga por psicólogo">
          {porPsicologo.length > 0 ? (
            <HorizontalBarList data={porPsicologo} />
          ) : (
            <p className="text-sm text-muted-foreground">Sin psicólogos activos.</p>
          )}
        </Panel>
        <Panel icon={Layers} title="Casos por nivel">
          <div className="flex flex-wrap items-center gap-6">
            <DonutChart data={porNivel} />
            <Legend items={porNivel} />
          </div>
        </Panel>
        <Panel icon={TrendingUp} title="Incidencias por mes">
          {porMes.length ? (
            <LineChart data={porMes} />
          ) : (
            <p className="text-sm text-muted-foreground">Sin datos suficientes.</p>
          )}
        </Panel>
        <Panel icon={BarChart3} title="Incidencias por prioridad">
          <BarChart data={porPrioridad} />
        </Panel>
      </div>
    </>
  );
}

function Panel({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border p-4 text-primary">
        <Icon className="size-4" />
        <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
