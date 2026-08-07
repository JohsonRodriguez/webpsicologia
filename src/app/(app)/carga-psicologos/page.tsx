import { Scale, ListTree } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { HorizontalBarList } from "@/components/charts";
import { SeccionCard } from "@/components/detail-ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function CargaPsicologosPage() {
  await requireUsuario(["jefe_psicologia"]);
  const supabase = await createClient();

  const [{ data: psicologos }, { data: casos }] = await Promise.all([
    supabase.from("usuarios").select("id, nombre").in("rol", ["psicologo", "jefe_psicologia"]).eq("activo", true).order("nombre"),
    supabase.from("casos").select("id, psicologo_id, estado"),
  ]);

  const filas = (psicologos ?? [])
    .map((p) => {
      const propios = (casos ?? []).filter((c) => c.psicologo_id === p.id);
      return {
        id: p.id,
        nombre: p.nombre,
        total: propios.length,
        abierto: propios.filter((c) => c.estado === "abierto").length,
        en_atencion: propios.filter((c) => c.estado === "en_atencion").length,
        derivado: propios.filter((c) => c.estado === "derivado").length,
        cerrado: propios.filter((c) => c.estado === "cerrado").length,
      };
    })
    .sort((a, b) => b.total - a.total);

  const datosGrafico = filas.map((f) => ({ label: f.nombre.split(" ")[0], value: f.total }));

  return (
    <>
      <PageHeader
        eyebrow="Jefatura"
        title="Carga por psicólogo"
        description="Cantidad de casos asignados a cada psicólogo del equipo, activos y cerrados."
      />

      <SeccionCard icon={Scale} titulo="Total de casos por psicólogo">
        {filas.length > 0 ? (
          <HorizontalBarList data={datosGrafico} />
        ) : (
          <p className="text-sm text-muted-foreground">No hay psicólogos activos.</p>
        )}
      </SeccionCard>

      <SeccionCard icon={ListTree} titulo="Detalle por estado">
        {filas.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Psicólogo</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Abierto</TableHead>
                <TableHead>En atención</TableHead>
                <TableHead>Derivado</TableHead>
                <TableHead>Cerrado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-semibold">{f.nombre}</TableCell>
                  <TableCell className="tabular-nums font-bold">{f.total}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{f.abierto}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{f.en_atencion}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{f.derivado}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{f.cerrado}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">Sin datos.</p>
        )}
      </SeccionCard>
    </>
  );
}
