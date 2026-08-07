"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableRow } from "@/components/clickable-row";
import { PdfDownloadLink } from "@/components/pdf-download-link";
import { FiltroAcademico } from "@/components/filtro-academico";

export type FilaReunion = {
  id: string;
  casoId: string;
  fecha: string;
  hora: string;
  nombres: string;
  apellidos: string;
  firmada: boolean;
  nivelId: string;
  nivelNombre: string;
  gradoId: string;
  gradoNombre: string;
  seccionId: string;
  seccionNombre: string;
};

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="font-heading text-3xl">{value}</p>
    </div>
  );
}

export function ReunionesFiltro({ filas }: { filas: FilaReunion[] }) {
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <FiltroAcademico items={filas}>
      {(filtradas) => {
        const proximas = filtradas.filter((r) => r.fecha >= hoy).length;
        const firmadas = filtradas.filter((r) => r.firmada).length;

        return (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
              <StatTile label="Total" value={filtradas.length} />
              <StatTile label="Próximas o de hoy" value={proximas} />
              <StatTile label="Firmadas" value={firmadas} />
              <StatTile label="Pendientes de firma" value={filtradas.length - firmadas} />
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm">
              {filtradas.length === 0 ? (
                <p className="px-4 py-14 text-center text-sm text-muted-foreground">
                  No hay reuniones que coincidan con el filtro.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alumno</TableHead>
                      <TableHead>Grado y sección</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtradas.map((r) => (
                      <ClickableRow key={r.id} href={`/casos/${r.casoId}`}>
                        <TableCell className="font-semibold">
                          {r.nombres} {r.apellidos}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {r.gradoNombre} &quot;{r.seccionNombre}&quot;
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
                              r.firmada
                                ? "inline-flex items-center rounded-full bg-good px-2.5 py-1 text-xs font-bold text-white"
                                : "inline-flex items-center rounded-full bg-warn px-2.5 py-1 text-xs font-bold text-white"
                            }
                          >
                            {r.firmada ? "Firmada" : "Pendiente de firma"}
                          </span>
                        </TableCell>
                        <TableCell>{r.firmada && <PdfDownloadLink href={`/api/citas/${r.id}/pdf`} />}</TableCell>
                      </ClickableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        );
      }}
    </FiltroAcademico>
  );
}
