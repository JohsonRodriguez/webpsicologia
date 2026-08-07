import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NuevoAnioButton } from "./nuevo-anio-button";
import { ActivarAnioButton } from "./activar-anio-button";

export default async function AdminAniosPage() {
  await requireUsuario(["administrador"]);
  const supabase = await createClient();

  const { data: anios } = await supabase
    .from("anios_academicos")
    .select("id, anio, activo")
    .order("anio", { ascending: false });

  const { data: matriculas } = await supabase.from("matriculas").select("id, anio_academico_id");
  const conteo = new Map<string, number>();
  for (const m of matriculas ?? []) conteo.set(m.anio_academico_id, (conteo.get(m.anio_academico_id) ?? 0) + 1);

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Años académicos"
        description="Solo un año lectivo puede estar activo a la vez."
        actions={<NuevoAnioButton anios={(anios ?? []).map((a) => a.anio)} />}
      />
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Año</TableHead>
              <TableHead>Matrículas</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(anios ?? []).map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-semibold tabular-nums">{a.anio}</TableCell>
                <TableCell className="text-muted-foreground">{conteo.get(a.id) ?? 0} matrículas</TableCell>
                <TableCell>
                  {a.activo ? (
                    <span className="inline-flex items-center rounded-full bg-good px-2.5 py-1 text-xs font-bold text-white">
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground">
                      Cerrado
                    </span>
                  )}
                </TableCell>
                <TableCell>{!a.activo && <ActivarAnioButton id={a.id} />}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
