import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function AdminGradosPage() {
  await requireUsuario(["administrador"]);
  const supabase = await createClient();

  const { data: niveles } = await supabase.from("niveles").select("id, nombre, orden").order("orden");
  const { data: grados } = await supabase.from("grados").select("id, nivel_id, nombre, orden").order("orden");
  const { data: secciones } = await supabase.from("secciones").select("id, grado_id, nombre");
  const { data: asignaciones } = await supabase.from("psicologo_grado").select("grado_id, usuarios(nombre)");

  const asignacionPorGrado = new Map(
    (asignaciones ?? []).map((a) => [a.grado_id, (a.usuarios as unknown as { nombre: string } | null)?.nombre]),
  );

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Grados y secciones"
        description="Estructura académica del colegio, por nivel."
      />
      {(niveles ?? []).map((nivel) => {
        const gradosNivel = (grados ?? []).filter((g) => g.nivel_id === nivel.id);
        return (
          <div key={nivel.id} className="rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border p-4">
              <h3 className="font-heading text-base font-semibold">{nivel.nombre}</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grado</TableHead>
                  <TableHead>Secciones</TableHead>
                  <TableHead>Psicólogo asignado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gradosNivel.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-semibold">{g.nombre}</TableCell>
                    <TableCell>{(secciones ?? []).filter((s) => s.grado_id === g.id).map((s) => s.nombre).join(", ")}</TableCell>
                    <TableCell className="text-muted-foreground">{asignacionPorGrado.get(g.id) ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
      })}
    </>
  );
}
