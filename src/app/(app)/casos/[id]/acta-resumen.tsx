import { PenLine } from "lucide-react";

type Firma = { id: string; firmante_tipo: string; firmante_nombre: string; fecha_hora: string };
type Cita = { id: string; fecha: string; hora: string; detalle: string; firmas: Firma[] };

export function ActaResumen({ cita }: { cita: Cita }) {
  const firmada = cita.firmas.length >= 2;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3.5">
      <div className="flex items-center justify-between">
        <strong className="tabular-nums text-sm">
          {new Date(cita.fecha + "T00:00:00").toLocaleDateString("es-PE", { dateStyle: "long" })} · {cita.hora}
        </strong>
        <span
          className={
            firmada
              ? "inline-flex items-center rounded-full bg-good-soft px-2.5 py-1 text-xs font-bold text-good"
              : "inline-flex items-center rounded-full bg-warn-soft px-2.5 py-1 text-xs font-bold text-warn"
          }
        >
          {firmada ? "Firmada" : "Pendiente de firma"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{cita.detalle}</p>
      {cita.firmas.length > 0 && (
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          {cita.firmas.map((f) => (
            <span key={f.id} className="flex items-center gap-1.5">
              <PenLine className="size-3" />
              {f.firmante_nombre} ({f.firmante_tipo}) —{" "}
              {new Date(f.fecha_hora).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
