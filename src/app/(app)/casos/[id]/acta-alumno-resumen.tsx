import { PenLine } from "lucide-react";
import { PdfDownloadLink } from "@/components/pdf-download-link";
import { TextoConEnfasis } from "@/components/texto-con-enfasis";
import { CompletarActaAlumnoDialog } from "./completar-acta-alumno-dialog";

type ActaAlumno = {
  id: string;
  fecha: string;
  hora: string;
  detalle: string;
  declaracion_alumno: string | null;
  acuerdos: string | null;
  firma_alumno_nombre: string | null;
  firma_fecha_hora: string | null;
};

export function ActaAlumnoResumen({ acta, alumnoNombre }: { acta: ActaAlumno; alumnoNombre: string }) {
  const firmada = Boolean(acta.firma_alumno_nombre);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3.5">
      <div className="flex items-center justify-between gap-2">
        <strong className="tabular-nums text-sm">
          {new Date(acta.fecha + "T00:00:00").toLocaleDateString("es-PE", { dateStyle: "long" })} · {acta.hora}
        </strong>
        <div className="flex items-center gap-2">
          {firmada ? (
            <span className="inline-flex items-center rounded-full bg-good px-2.5 py-1 text-xs font-bold text-white">
              Firmada
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-warn px-2.5 py-1 text-xs font-bold text-white">
              Borrador
            </span>
          )}
          {firmada ? (
            <PdfDownloadLink href={`/api/actas-alumno/${acta.id}/pdf`} />
          ) : (
            <CompletarActaAlumnoDialog
              actaId={acta.id}
              alumnoNombre={alumnoNombre}
              declaracionInicial={acta.declaracion_alumno ?? ""}
              compromisoInicial={acta.acuerdos ?? ""}
            />
          )}
        </div>
      </div>
      <TextoConEnfasis texto={acta.detalle} className="text-sm text-muted-foreground" />
      {!firmada && (
        <p className="text-xs text-muted-foreground">
          Declaración: {acta.declaracion_alumno ? "lista" : "pendiente"} · Compromiso:{" "}
          {acta.acuerdos ? "listo" : "pendiente"}
        </p>
      )}
      {firmada && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <PenLine className="size-3" />
          {acta.firma_alumno_nombre} (alumno) —{" "}
          {new Date(acta.firma_fecha_hora!).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })}
        </span>
      )}
    </div>
  );
}
