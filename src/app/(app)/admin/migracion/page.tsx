import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnioActivo, getAnios } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Info } from "lucide-react";
import { MigracionForm } from "./migracion-form";

export default async function AdminMigracionPage() {
  await requireUsuario(["administrador"]);
  const supabase = await createClient();

  const activo = await getAnioActivo(supabase);
  const anios = await getAnios(supabase);
  const destinos = anios.filter((a) => a.id !== activo?.id);

  const { count } = await supabase
    .from("matriculas")
    .select("id", { count: "exact", head: true })
    .eq("anio_academico_id", activo?.id ?? "");

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Migración de grado"
        description="Promoción masiva de alumnos hacia un nuevo año lectivo, siguiendo la secuencia curricular."
      />
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-2.5 rounded-lg bg-info-soft px-3.5 py-2.5 text-sm text-info">
          <Info className="mt-0.5 size-4 flex-none" />
          <span>
            Año origen: <strong>{activo?.anio}</strong> ({count ?? 0} matrículas). Cada alumno pasará al siguiente
            grado en orden curricular; los de último año de secundaria egresan y no se migran.
          </span>
        </div>
        <MigracionForm destinos={destinos} />
      </div>
    </>
  );
}
