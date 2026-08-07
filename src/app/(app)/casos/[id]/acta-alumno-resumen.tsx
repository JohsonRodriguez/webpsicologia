import { Download, PenLine } from "lucide-react";

type ActaAlumno = {
  id: string;
  fecha: string;
  hora: string;
  detalle: string;
  firma_alumno_nombre: string;
  firma_fecha_hora: string;
};

export function ActaAlumnoResumen({ acta }: { acta: ActaAlumno }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3.5">
      <div className="flex items-center justify-between gap-2">
        <strong className="tabular-nums text-sm">
          {new Date(acta.fecha + "T00:00:00").toLocaleDateString("es-PE", { dateStyle: "long" })} · {acta.hora}
        </strong>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-good px-2.5 py-1 text-xs font-bold text-white">
            Firmada
          </span>
          <a
            href={`/api/actas-alumno/${acta.id}/pdf`}
            className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Download className="size-3.5" />
            PDF
          </a>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{acta.detalle}</p>
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <PenLine className="size-3" />
        {acta.firma_alumno_nombre} (alumno) —{" "}
        {new Date(acta.firma_fecha_hora).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })}
      </span>
    </div>
  );
}
