import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rangoPagina, totalPaginas } from "@/lib/queries";
import { construirQuery } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Paginacion } from "@/components/paginacion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const ACCION_LABEL: Record<string, string> = {
  "usuario.rol_actualizado": "Actualizó un usuario",
  "caso.abierto": "Abrió un caso",
  "caso.derivado": "Derivó un caso",
  "caso.cerrado": "Cerró un caso",
  "grado.eliminado": "Eliminó un grado",
  "seccion.eliminada": "Eliminó una sección",
};

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireUsuario(["jefe_psicologia", "administrador"]);
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const supabase = await createClient();

  const { from, to } = rangoPagina(page);
  const { data, count } = await supabase
    .from("auditoria")
    .select("id, accion, entidad, entidad_id, detalle, created_at, usuarios(nombre, email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const registros = data ?? [];
  const totalPages = totalPaginas(count);

  return (
    <>
      <PageHeader
        eyebrow="Seguridad"
        title="Auditoría"
        description="Registro de acciones sensibles: cambios de rol, ciclo de vida de casos y eliminaciones de estructura académica."
      />
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {registros.length === 0 ? (
          <div className="px-4 py-14 text-center text-sm text-muted-foreground">Sin registros todavía.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Fecha</TableHead>
                  <TableHead>Quién</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead className="pr-4">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros.map((r) => {
                  const actor = r.usuarios as unknown as { nombre: string; email: string } | null;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="pl-4 tabular-nums text-muted-foreground">
                        {new Date(r.created_at).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">{actor?.nombre ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{actor?.email ?? ""}</div>
                      </TableCell>
                      <TableCell>{ACCION_LABEL[r.accion] ?? r.accion}</TableCell>
                      <TableCell className="max-w-xs truncate pr-4 text-xs text-muted-foreground">
                        {r.detalle ? JSON.stringify(r.detalle) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        <Paginacion
          page={Math.min(page, totalPages)}
          totalPages={totalPages}
          hrefPagina={(p) => `/auditoria${construirQuery({ page: p })}`}
        />
      </div>
    </>
  );
}
