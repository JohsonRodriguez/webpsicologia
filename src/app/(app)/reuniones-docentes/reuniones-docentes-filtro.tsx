"use client";

import { Trophy, TrendingDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PdfDownloadLink } from "@/components/pdf-download-link";
import { FiltroAcademico } from "@/components/filtro-academico";

export type FilaReunionDocente = {
  id: string;
  fecha: string;
  hora: string;
  detalle: string;
  alumnoNombre: string;
  docenteNombre: string;
  firmada: boolean;
  pdfHref: string;
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

function DocenteTile({
  label,
  icon: Icon,
  docente,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  docente: { nombre: string; total: number } | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <Icon className="size-3.5" />
        {label}
      </p>
      {docente ? (
        <>
          <p className="font-heading truncate text-lg leading-tight">{docente.nombre}</p>
          <p className="text-xs text-muted-foreground">
            {docente.total} {docente.total === 1 ? "reunión" : "reuniones"}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Sin datos</p>
      )}
    </div>
  );
}

export function ReunionesDocentesFiltro({
  filas,
  totalReuniones,
  docenteConMas,
  docenteConMenos,
  alumnosSinActa,
}: {
  filas: FilaReunionDocente[];
  totalReuniones: number;
  docenteConMas: { nombre: string; total: number } | null;
  docenteConMenos: { nombre: string; total: number } | null;
  alumnosSinActa: number;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <StatTile label="Total de reuniones" value={totalReuniones} />
        <DocenteTile label="Docente con más reuniones" icon={Trophy} docente={docenteConMas} />
        <DocenteTile label="Docente con menos reuniones" icon={TrendingDown} docente={docenteConMenos} />
        <StatTile label="Mis alumnos sin acta de docente" value={alumnosSinActa} />
      </div>

      <FiltroAcademico items={filas}>
        {(filtradas) => (
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
                    <TableHead>Docente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtradas.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-semibold">{f.alumnoNombre}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {f.gradoNombre} &quot;{f.seccionNombre}&quot;
                      </TableCell>
                      <TableCell className="text-muted-foreground">{f.docenteNombre}</TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {new Date(f.fecha + "T00:00:00").toLocaleDateString("es-PE", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{resumenMotivo(f.detalle)}</TableCell>
                      <TableCell>{f.firmada && <PdfDownloadLink href={f.pdfHref} />}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </FiltroAcademico>
    </div>
  );
}
