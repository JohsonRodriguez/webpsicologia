"use client";

import { FiltroAcademico } from "@/components/filtro-academico";
import { ActaResumen } from "../casos/[id]/acta-resumen";
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

            {filtradas.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
                <p className="text-sm text-muted-foreground">No hay actas que coincidan con el filtro.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtradas.map((f) => (
                  <div key={f.id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3.5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm">{f.alumnoNombre}</strong>
                      <span className="text-xs text-muted-foreground">
                        {f.gradoNombre} &quot;{f.seccionNombre}&quot;
                      </span>
                      {f.origen === "docente" && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                          Registrada por ti
                        </span>
                      )}
                    </div>
                    <ActaResumen cita={f} pdfHref={f.pdfHref} />
                    {f.puedeFirmar && <FirmarActaButton citaId={f.id} tieneFirmaGuardada={tieneFirmaGuardada} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }}
    </FiltroAcademico>
  );
}
