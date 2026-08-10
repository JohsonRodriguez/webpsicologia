import { describe, expect, it } from "vitest";
import { filtroNombreAlumno, nombreAlumno, rangoPagina, totalPaginas } from "./queries";

describe("nombreAlumno", () => {
  it("junta nombres y apellidos con un espacio", () => {
    expect(nombreAlumno({ nombres: "Ana", apellidos: "Pérez" })).toBe("Ana Pérez");
  });
});

describe("rangoPagina", () => {
  it("calcula el rango de la primera página", () => {
    expect(rangoPagina(1)).toEqual({ from: 0, to: 19 });
  });

  it("calcula el rango de páginas siguientes", () => {
    expect(rangoPagina(2)).toEqual({ from: 20, to: 39 });
    expect(rangoPagina(3)).toEqual({ from: 40, to: 59 });
  });
});

describe("totalPaginas", () => {
  it("nunca devuelve menos de 1 página, incluso sin resultados", () => {
    expect(totalPaginas(0)).toBe(1);
    expect(totalPaginas(null)).toBe(1);
  });

  it("redondea hacia arriba cuando sobran filas", () => {
    expect(totalPaginas(20)).toBe(1);
    expect(totalPaginas(21)).toBe(2);
    expect(totalPaginas(41)).toBe(3);
  });
});

describe("filtroNombreAlumno", () => {
  it("arma un filtro OR de PostgREST buscando en nombres y apellidos", () => {
    expect(filtroNombreAlumno("ana")).toBe('nombres.ilike."%ana%",apellidos.ilike."%ana%"');
  });

  it("escapa los comodines de ILIKE para que se busquen de forma literal", () => {
    expect(filtroNombreAlumno("50%_off")).toBe('nombres.ilike."%50\\%\\_off%",apellidos.ilike."%50\\%\\_off%"');
  });

  it("escapa comillas dobles para no romper la sintaxis de .or()", () => {
    expect(filtroNombreAlumno('ana "la reina"')).toBe(
      'nombres.ilike."%ana \\"la reina\\"%",apellidos.ilike."%ana \\"la reina\\"%"',
    );
  });
});
