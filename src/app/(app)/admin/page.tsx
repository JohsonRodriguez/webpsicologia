import Link from "next/link";
import { GraduationCap, Users, BriefcaseBusiness, Presentation, UserCog, ChartPie, Layers } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnioActivo, getMatriculasPorAlumno } from "@/lib/queries";
import { rolLabel } from "@/lib/roles";
import type { Rol } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { BarChart } from "@/components/charts";
import { Button } from "@/components/ui/button";

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

export default async function AdminDashboardPage() {
  await requireUsuario(["administrador"]);
  const supabase = await createClient();

  const anioActivo = await getAnioActivo(supabase);
  const [{ data: matriculas }, { data: usuarios }] = await Promise.all([
    supabase.from("matriculas").select("id").eq("anio_academico_id", anioActivo?.id ?? ""),
    supabase.from("usuarios").select("id, rol, activo"),
  ]);

  const matriculasPorAlumno = await getMatriculasPorAlumno(supabase, anioActivo?.id);
  const totalDocentes = (usuarios ?? []).filter((u) => u.rol === "profesor").length;
  const totalPsicologos = (usuarios ?? []).filter((u) => u.rol === "psicologo" || u.rol === "jefe_psicologia").length;

  const roles: Rol[] = ["profesor", "psicologo", "jefe_psicologia", "administrador", "coordinador_bienestar"];
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
        actions={
          <Button
            variant="outline"
            render={
              <Link href="/admin/usuarios">
                <UserCog className="size-4" />
                Gestionar usuarios
              </Link>
            }
          />
        }
      />
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatTile label="Alumnos matriculados" value={matriculas?.length ?? 0} icon={GraduationCap} tono="primary" />
        <StatTile label="Usuarios activos" value={(usuarios ?? []).filter((u) => u.activo).length} icon={Users} tono="good" />
        <StatTile label="Total de psicólogos" value={totalPsicologos} icon={BriefcaseBusiness} tono="warn" />
        <StatTile label="Total de docentes" value={totalDocentes} icon={Presentation} tono="critical" />
      </div>
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <CardChart icon={ChartPie} titulo="Usuarios por rol">
          <BarChart data={porRol} />
        </CardChart>
        <CardChart icon={Layers} titulo="Alumnos por nivel">
          <BarChart data={porNivel} />
        </CardChart>
      </div>
    </>
  );
}
