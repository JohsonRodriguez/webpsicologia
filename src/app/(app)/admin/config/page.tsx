import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AsignacionSelect } from "./asignacion-select";
import { CatalogoMotivos } from "./catalogo-motivos";

export default async function AdminConfigPage() {
  await requireUsuario(["administrador"]);
  const supabase = await createClient();

  const [{ data: grados }, { data: niveles }, { data: asignaciones }, { data: psicologos }, { data: motivos }] =
    await Promise.all([
      supabase.from("grados").select("id, nivel_id, nombre, orden").order("orden"),
      supabase.from("niveles").select("id, nombre, orden").order("orden"),
      supabase.from("psicologo_grado").select("grado_id, usuario_id"),
      supabase.from("usuarios").select("id, nombre").eq("rol", "psicologo").eq("activo", true).order("nombre"),
      supabase.from("catalogo_motivos").select("id, nombre, activo").order("nombre"),
    ]);

  const nivelPorId = new Map((niveles ?? []).map((n) => [n.id, n.nombre]));
  const asignacionPorGrado = new Map((asignaciones ?? []).map((a) => [a.grado_id, a.usuario_id]));

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Psicólogo por grado y catálogos"
        description="Define qué psicólogo cubre cada grado y administra los catálogos del sistema."
      />

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4">
          <h3 className="font-heading text-base font-semibold">Asignación psicólogo ↔ grado</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nivel</TableHead>
              <TableHead>Grado</TableHead>
              <TableHead>Psicólogo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(grados ?? []).map((g) => (
              <TableRow key={g.id}>
                <TableCell className="text-muted-foreground">{nivelPorId.get(g.nivel_id)}</TableCell>
                <TableCell className="font-semibold">{g.nombre}</TableCell>
                <TableCell>
                  <AsignacionSelect
                    gradoId={g.id}
                    actual={asignacionPorGrado.get(g.id) ?? ""}
                    psicologos={psicologos ?? []}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CatalogoMotivos motivos={motivos ?? []} />
    </>
  );
}
