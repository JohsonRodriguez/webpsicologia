import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { nombreAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableRow } from "@/components/clickable-row";
import { PdfDownloadLink } from "@/components/pdf-download-link";

export default async function ReunionesPage() {
  const usuario = await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();

  const { data: citas } = await supabase
    .from("citas_padres")
    .select(
      "id, fecha, hora, detalle, caso_id, casos!inner(psicologo_id, alumno_id, alumnos(nombres, apellidos)), firmas(id)",
    )
    .eq("casos.psicologo_id", usuario.id)
    .order("fecha", { ascending: false });

  const reuniones = citas ?? [];
  const hoy = new Date().toISOString().slice(0, 10);
  const proximas = reuniones.filter((r) => r.fecha >= hoy).length;

  return (
    <>
      <PageHeader
        eyebrow="Psicología"
        title="Reuniones con padres"
        description="Actas de reunión registradas en tus casos, agendadas y documentadas aquí. La cita en sí se coordina en SIANET."
      />

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <StatTile label="Total" value={reuniones.length} />
        <StatTile label="Próximas o de hoy" value={proximas} />
        <StatTile label="Firmadas" value={reuniones.filter((r) => (r.firmas?.length ?? 0) >= 2).length} />
        <StatTile
          label="Pendientes de firma"
          value={reuniones.filter((r) => (r.firmas?.length ?? 0) < 2).length}
        />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        {reuniones.length === 0 ? (
          <p className="px-4 py-14 text-center text-sm text-muted-foreground">
            No tienes reuniones con padres registradas todavía.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alumno</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reuniones.map((r) => {
                const caso = r.casos as unknown as {
                  alumno_id: string;
                  alumnos: { nombres: string; apellidos: string } | null;
                };
                const firmada = (r.firmas?.length ?? 0) >= 2;
                return (
                  <ClickableRow key={r.id} href={`/casos/${r.caso_id}`}>
                    <TableCell className="font-semibold">
                      {caso.alumnos ? nombreAlumno(caso.alumnos) : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {new Date(r.fecha + "T00:00:00").toLocaleDateString("es-PE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{r.hora}</TableCell>
                    <TableCell>
                      <span
                        className={
                          firmada
                            ? "inline-flex items-center rounded-full bg-good px-2.5 py-1 text-xs font-bold text-white"
                            : "inline-flex items-center rounded-full bg-warn px-2.5 py-1 text-xs font-bold text-white"
                        }
                      >
                        {firmada ? "Firmada" : "Pendiente de firma"}
                      </span>
                    </TableCell>
                    <TableCell>{firmada && <PdfDownloadLink href={`/api/citas/${r.id}/pdf`} />}</TableCell>
                  </ClickableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="font-heading text-3xl">{value}</p>
    </div>
  );
}
