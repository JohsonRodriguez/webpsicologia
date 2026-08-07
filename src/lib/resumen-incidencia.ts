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
