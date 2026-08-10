import { School, ListTree } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { HorizontalBarList } from "@/components/charts";
import { SeccionCard } from "@/components/detail-ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function DocentesPage() {
  const usuario = await requireUsuario(["psicologo", "jefe_psicologia"]);
  const esJefe = usuario.rol === "jefe_psicologia";
  const supabase = await createClient();

  // Sin filtrar incidencias por alumno: la policy RLS ya limita las filas a
  // los alumnos del grado del psicólogo, o a todo el colegio para jefatura.
  const [{ data: docentes }, { data: incidencias }] = await Promise.all([
    supabase.from("usuarios").select("id, nombre").eq("rol", "profesor").eq("activo", true).order("nombre"),
    supabase.from("incidencias").select("id, profesor_id, estado"),
  ]);

  const filas = (docentes ?? [])
    .map((d) => {
      const propias = (incidencias ?? []).filter((i) => i.profesor_id === d.id);
      return {
        id: d.id,
        nombre: d.nombre,
        total: propias.length,
        nueva: propias.filter((i) => i.estado === "nueva").length,
        en_revision: propias.filter((i) => i.estado === "en_revision").length,
        derivada: propias.filter((i) => i.estado === "derivada").length,
        cerrada: propias.filter((i) => i.estado === "cerrada").length,
      };
    })
    .filter((f) => f.total > 0)
    .sort((a, b) => b.total - a.total);

  const datosGrafico = filas.map((f) => ({ label: f.nombre.split(" ")[0], value: f.total }));

  return (
    <>
      <PageHeader
        eyebrow="Psicología"
        title="Docentes"
        description={
          esJefe
            ? "Incidencias reportadas por cada docente del colegio."
            : "Incidencias reportadas por cada docente sobre tus alumnos asignados."
        }
      />

      <SeccionCard icon={School} titulo="Docente que más reporta">
        {filas.length > 0 ? (
          <HorizontalBarList data={datosGrafico} />
        ) : (
          <p className="text-sm text-muted-foreground">Sin incidencias reportadas todavía.</p>
        )}
      </SeccionCard>

      <SeccionCard icon={ListTree} titulo="Detalle por estado">
        {filas.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Docente</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Nueva</TableHead>
                <TableHead>En revisión</TableHead>
                <TableHead>Derivada</TableHead>
                <TableHead>Cerrada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-semibold">{f.nombre}</TableCell>
                  <TableCell className="tabular-nums font-bold">{f.total}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{f.nueva}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{f.en_revision}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{f.derivada}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{f.cerrada}</TableCell>
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
