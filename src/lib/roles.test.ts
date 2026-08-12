import { describe, expect, it } from "vitest";
import { rolLabel, rutaInicioPara } from "./roles";

describe("rolLabel", () => {
  it("traduce cada rol a su etiqueta en español", () => {
    expect(rolLabel("profesor")).toBe("Profesor");
    expect(rolLabel("psicologo")).toBe("Psicólogo");
    expect(rolLabel("jefe_psicologia")).toBe("Jefe de psicólogos");
    expect(rolLabel("administrador")).toBe("Administrador");
    expect(rolLabel("coordinador_bienestar")).toBe("Coordinador de Bienestar Familiar");
  });
});

describe("rutaInicioPara", () => {
  it("manda a cada rol a su pantalla de inicio", () => {
    expect(rutaInicioPara("profesor")).toBe("/incidencias");
    expect(rutaInicioPara("administrador")).toBe("/admin");
    expect(rutaInicioPara("psicologo")).toBe("/dashboard");
    expect(rutaInicioPara("jefe_psicologia")).toBe("/dashboard");
    expect(rutaInicioPara("coordinador_bienestar")).toBe("/bienestar");
  });
});
