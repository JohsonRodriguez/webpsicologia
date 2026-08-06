import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnioActivo, getMatriculasPorAlumno } from "@/lib/queries";
import { rolLabel } from "@/lib/roles";
import type { Rol } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { BarChart } from "@/components/charts";

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="font-heading text-3xl">{value}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  await requireUsuario(["administrador"]);
  const supabase = await createClient();

  const anioActivo = await getAnioActivo(supabase);
  const [{ data: matriculas }, { data: usuarios }, { data: casos }, { data: incidencias }] = await Promise.all([
    supabase.from("matriculas").select("id").eq("anio_academico_id", anioActivo?.id ?? ""),
    supabase.from("usuarios").select("id, rol, activo"),
    supabase.from("casos").select("id, estado"),
    supabase.from("incidencias").select("id, fecha_hora"),
  ]);

  const matriculasPorAlumno = await getMatriculasPorAlumno(supabase);
  const anioNum = anioActivo?.anio ?? new Date().getFullYear();
  const incidenciasEsteAnio = (incidencias ?? []).filter((i) => new Date(i.fecha_hora).getFullYear() === anioNum).length;

  const roles: Rol[] = ["profesor", "psicologo", "jefe_psicologia", "administrador"];
  const porRol = roles.map((r) => ({
    label: rolLabel(r).split(" ")[0],
    value: (usuarios ?? []).filter((u) => u.rol === r).length,
    color: "var(--primary)",
  }));

  const niveles = ["Inicial", "Primaria", "Secundaria"];
  const porNivel = niveles.map((n) => ({
    label: n,
    value: [...matriculasPorAlumno.values()].filter((m) => m.nivelNombre === n).length,
    color: "var(--info)",
  }));

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Dashboard general del colegio"
        description="Vista agregada con permisos administrativos (equivalente a service role, solo en el servidor)."
      />
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatTile label="Alumnos matriculados" value={matriculas?.length ?? 0} />
        <StatTile label="Usuarios activos" value={(usuarios ?? []).filter((u) => u.activo).length} />
        <StatTile label="Casos abiertos" value={(casos ?? []).filter((c) => c.estado !== "cerrado").length} />
        <StatTile label={`Incidencias ${anioNum}`} value={incidenciasEsteAnio} />
      </div>
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-4">
            <h3 className="font-heading text-base font-semibold">Usuarios por rol</h3>
          </div>
          <div className="p-4">
            <BarChart data={porRol} />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-4">
            <h3 className="font-heading text-base font-semibold">Alumnos por nivel</h3>
          </div>
          <div className="p-4">
            <BarChart data={porNivel} />
          </div>
        </div>
      </div>
    </>
  );
}
