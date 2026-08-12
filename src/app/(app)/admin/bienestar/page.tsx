import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CoordinadorSelect } from "./coordinador-select";

export default async function AdminBienestarPage() {
  await requireUsuario(["administrador"]);
  const supabase = await createClient();

  const [{ data: niveles }, { data: asignaciones }, { data: coordinadores }] = await Promise.all([
    supabase.from("niveles").select("id, nombre, orden").order("orden"),
    supabase.from("coordinador_nivel").select("nivel_id, usuario_id"),
    supabase.from("usuarios").select("id, nombre").eq("rol", "coordinador_bienestar").eq("activo", true).order("nombre"),
  ]);

  const asignacionPorNivel = new Map((asignaciones ?? []).map((a) => [a.nivel_id, a.usuario_id]));

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Bienestar Familiar"
        description="Define qué coordinador de bienestar familiar atiende cada nivel. Módulo confidencial: ni psicólogos ni jefatura tienen acceso a estas actas."
      />

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4">
          <h3 className="font-heading text-base font-semibold">Asignación coordinador ↔ nivel</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nivel</TableHead>
              <TableHead>Coordinador</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(niveles ?? []).map((n) => (
              <TableRow key={n.id}>
                <TableCell className="font-semibold">{n.nombre}</TableCell>
                <TableCell>
                  <CoordinadorSelect
                    nivelId={n.id}
                    actual={asignacionPorNivel.get(n.id) ?? ""}
                    coordinadores={coordinadores ?? []}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
