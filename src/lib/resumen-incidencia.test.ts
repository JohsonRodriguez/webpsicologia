import { describe, expect, it } from "vitest";
import { construirMotivoDesdeIncidencia, partirDetalleConEnfasis } from "./resumen-incidencia";

describe("construirMotivoDesdeIncidencia", () => {
  const base = {
    fechaHora: "2026-08-05T14:30:00-05:00",
    profesorNombre: "Juan Pérez",
    motivo: "Conducta disruptiva",
    prioridad: "alta",
    descripcion: "El alumno se mostró agresivo con compañeros.",
    accionesTomadas: "Se conversó con el alumno y se notificó a psicología.",
    involucrados: "Dos compañeros de aula",
  };

  it("incluye al docente, el motivo, la descripción, las acciones y los involucrados", () => {
    const texto = construirMotivoDesdeIncidencia(base);

    expect(texto).toContain("Juan Pérez");
    expect(texto).toContain('por "Conducta disruptiva"');
    expect(texto).toContain('"El alumno se mostró agresivo con compañeros."');
    expect(texto).toContain("Se conversó con el alumno y se notificó a psicología.");
    expect(texto).toContain("Personas involucradas: Dos compañeros de aula");
  });

  it('usa "no se registraron" cuando no hay involucrados', () => {
    const texto = construirMotivoDesdeIncidencia({ ...base, involucrados: null });
    expect(texto).toContain("Personas involucradas: no se registraron");
  });
});

describe("partirDetalleConEnfasis", () => {
  it("separa el motivo (negrita) y la descripción (cursiva) cuando el texto sigue el patrón esperado", () => {
    const texto = 'El 5 de agosto, el docente Juan reportó una incidencia por "Conducta disruptiva":\n"Descripción larga."\n\nAcciones tomadas: ninguna.';

    const segmentos = partirDetalleConEnfasis(texto);

    const negrita = segmentos.find((s) => s.bold);
    const cursiva = segmentos.find((s) => s.italic);
    expect(negrita?.texto).toBe("Conducta disruptiva");
    expect(cursiva?.texto).toBe("Descripción larga.");
    // Reconstruir todos los segmentos debe dar el texto original intacto.
    expect(segmentos.map((s) => s.texto).join("")).toBe(texto);
  });

  it("devuelve el texto tal cual, sin marcar nada, cuando no calza con el patrón", () => {
    const texto = "El psicólogo escribió esto a mano, sin seguir el formato automático.";
    expect(partirDetalleConEnfasis(texto)).toEqual([{ texto }]);
  });
});
