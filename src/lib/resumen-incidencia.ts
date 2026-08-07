const PRIORIDAD_LABEL: Record<string, string> = { baja: "baja", media: "media", alta: "alta" };

export type IncidenciaParaResumen = {
  fechaHora: string;
  profesorNombre: string;
  motivo: string;
  prioridad: string;
  descripcion: string;
  accionesTomadas: string;
  involucrados: string | null;
};

export function construirMotivoDesdeIncidencia(inc: IncidenciaParaResumen) {
  const fecha = new Date(inc.fechaHora).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const partes = [
    `El ${fecha}, el docente ${inc.profesorNombre} reportó una incidencia de prioridad ${
      PRIORIDAD_LABEL[inc.prioridad] ?? inc.prioridad
    } por "${inc.motivo}":\n"${inc.descripcion}"`,
    `Acciones tomadas por el docente: ${inc.accionesTomadas}`,
  ];

  partes.push(`Personas involucradas: ${inc.involucrados || "no se registraron"}`);

  return partes.join("\n\n");
}

export type SegmentoTexto = { texto: string; bold?: boolean; italic?: boolean };

const PATRON_MOTIVO_DESCRIPCION = /por "([^"]+)":\n"([^"]+)"/;

/**
 * Si el texto sigue el patrón generado por construirMotivoDesdeIncidencia,
 * separa el motivo (para negrita) y la descripción (para cursiva) del resto.
 * Si el texto fue editado y ya no calza con el patrón, lo devuelve tal cual.
 */
export function partirDetalleConEnfasis(texto: string): SegmentoTexto[] {
  const match = texto.match(PATRON_MOTIVO_DESCRIPCION);
  if (!match || match.index === undefined) return [{ texto }];

  const [completo, motivo, descripcion] = match;
  const antes = texto.slice(0, match.index);
  const despues = texto.slice(match.index + completo.length);

  return [
    { texto: `${antes}por "` },
    { texto: motivo, bold: true },
    { texto: '":\n"' },
    { texto: descripcion, italic: true },
    { texto: `"${despues}` },
  ];
}
