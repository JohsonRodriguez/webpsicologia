"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PdfDownloadLink } from "@/components/pdf-download-link";
import { FiltroAcademico } from "@/components/filtro-academico";
import { FirmarActaButton } from "./firmar-acta-button";

export type FilaMiActa = {
  id: string;
  origen: "docente" | "caso";
  fecha: string;
  hora: string;
  detalle: string;
  alumnoNombre: string;
  firmas: { id: string; firmante_tipo: string; firmante_nombre: string; fecha_hora: string }[];
  pdfHref: string;
  puedeFirmar: boolean;
  nivelId: string;
  nivelNombre: string;
  gradoId: string;
  gradoNombre: string;
  seccionId: string;
  seccionNombre: string;
};

function resumenMotivo(detalle: string) {
  const palabras = detalle.trim().split(/\s+/);
  if (palabras.length <= 3) return detalle;
  return `${palabras.slice(0, 3).join(" ")}…`;
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="font-heading text-3xl">{value}</p>
    </div>
  );
}

export function MisActasFiltro({ filas, tieneFirmaGuardada }: { filas: FilaMiActa[]; tieneFirmaGuardada: boolean }) {
  return (
    <FiltroAcademico items={filas}>
      {(filtradas) => {
        const pendientesDeFirma = filtradas.filter((f) => f.puedeFirmar).length;

        return (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
              <StatTile label="Total" value={filtradas.length} />
              <StatTile label="Registradas por ti" value={filtradas.filter((f) => f.origen === "docente").length} />
              <StatTile label="Pendientes de tu firma" value={pendientesDeFirma} />
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm">
              {filtradas.length === 0 ? (
                <p className="px-4 py-14 text-center text-sm text-muted-foreground">
                  No hay actas que coincidan con el filtro.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alumno</TableHead>
                      <TableHead>Grado y sección</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtradas.map((f) => {
                      const firmada = f.firmas.length >= 1;
                      return (
                        <TableRow key={f.id}>
                          <TableCell className="font-semibold">{f.alumnoNombre}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {f.gradoNombre} &quot;{f.seccionNombre}&quot;
                          </TableCell>
                          <TableCell className="tabular-nums text-muted-foreground">
                            {new Date(f.fecha + "T00:00:00").toLocaleDateString("es-PE", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{resumenMotivo(f.detalle)}</TableCell>
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
                          <TableCell>
                            <div className="flex flex-col items-end gap-2">
                              {firmada && <PdfDownloadLink href={f.pdfHref} />}
                              {f.puedeFirmar && <FirmarActaButton citaId={f.id} tieneFirmaGuardada={tieneFirmaGuardada} />}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
