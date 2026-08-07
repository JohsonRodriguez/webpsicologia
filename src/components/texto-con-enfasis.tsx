import { partirDetalleConEnfasis } from "@/lib/resumen-incidencia";

export function TextoConEnfasis({ texto, className }: { texto: string; className?: string }) {
  const segmentos = partirDetalleConEnfasis(texto);

  return (
    <p className={`whitespace-pre-line ${className ?? ""}`}>
      {segmentos.map((s, i) =>
        s.bold ? (
          <strong key={i}>{s.texto}</strong>
        ) : s.italic ? (
          <em key={i}>{s.texto}</em>
        ) : (
          <span key={i}>{s.texto}</span>
        ),
      )}
    </p>
  );
}
