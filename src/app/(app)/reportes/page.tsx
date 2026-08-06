import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMatriculasPorAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { BarChart } from "@/components/charts";

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

  const porPsicologo = (psicologos ?? []).map((p) => ({
    label: p.nombre.split(" ")[0],
    value: (casos ?? []).filter((c) => c.psicologo_id === p.id).length,
    color: "var(--primary)",
  }));

  const niveles = ["Inicial", "Primaria", "Secundaria"];
  const porNivel = niveles.map((n) => ({
    label: n,
    value: (casos ?? []).filter((c) => matriculas.get(c.alumno_id)?.nivelNombre === n).length,
    color: "var(--info)",
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
      color: "var(--warn)",
    }));

  const porPrioridad = [
    { label: "baja", value: (incidencias ?? []).filter((i) => i.prioridad === "baja").length, color: "var(--good)" },
    { label: "media", value: (incidencias ?? []).filter((i) => i.prioridad === "media").length, color: "var(--warn)" },
    { label: "alta", value: (incidencias ?? []).filter((i) => i.prioridad === "alta").length, color: "var(--critical)" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Jefatura"
        title="Reportes y estadísticas"
        description="Carga de trabajo del equipo, distribución por grado, por mes y por prioridad."
      />
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Panel title="Carga por psicólogo">
          <BarChart data={porPsicologo} />
        </Panel>
        <Panel title="Casos por nivel">
          <BarChart data={porNivel} />
        </Panel>
        <Panel title="Incidencias por mes">
          {porMes.length ? (
            <BarChart data={porMes} />
          ) : (
            <p className="text-sm text-muted-foreground">Sin datos suficientes.</p>
          )}
        </Panel>
        <Panel title="Incidencias por prioridad">
          <BarChart data={porPrioridad} />
        </Panel>
      </div>
    </>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-4">
        <h3 className="font-heading text-base font-semibold">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
