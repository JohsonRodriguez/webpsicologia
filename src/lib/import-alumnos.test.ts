import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { ordenDesdeNombreGrado, parseAlumnosSheet } from "./import-alumnos";

function bufferDesdeFilas(filas: unknown[][]): ArrayBuffer {
  const hoja = XLSX.utils.aoa_to_sheet(filas);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Alumnos");
  return XLSX.write(libro, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

describe("ordenDesdeNombreGrado", () => {
  it("extrae el número inicial del nombre del grado", () => {
    expect(ordenDesdeNombreGrado("1° Grado de Primaria")).toBe(1);
    expect(ordenDesdeNombreGrado("2 Años")).toBe(2);
    expect(ordenDesdeNombreGrado("5to de Secundaria")).toBe(5);
  });

  it("devuelve 0 si no hay ningún número en el nombre", () => {
    expect(ordenDesdeNombreGrado("Aula Inicial")).toBe(0);
  });
});

describe("parseAlumnosSheet", () => {
  it("parsea filas válidas con encabezados en el formato esperado", () => {
    const buffer = bufferDesdeFilas([
      ["Codigo", "Nombres", "Apellidos", "Nivel", "Grado", "Sección"],
      ["LB001", "Ana", "Pérez", "Primaria", "1° Grado", "A"],
      ["LB002", "Luis", "Gómez", "Primaria", "1° Grado", "B"],
    ]);

    const resultado = parseAlumnosSheet(buffer);

    expect(resultado.errores).toEqual([]);
    expect(resultado.filas).toHaveLength(2);
    expect(resultado.filas[0]).toMatchObject({
      codigo: "LB001",
      nombres: "Ana",
      apellidos: "Pérez",
      nivel: "Primaria",
      grado: "1° Grado",
      seccion: "A",
    });
  });

  it("acepta apellido paterno y materno por separado y los combina", () => {
    const buffer = bufferDesdeFilas([
      ["Codigo", "Nombres", "Apellido Paterno", "Apellido Materno", "Nivel", "Grado", "Seccion"],
      ["LB003", "Ana", "Pérez", "López", "Primaria", "1° Grado", "A"],
    ]);

    const resultado = parseAlumnosSheet(buffer);

    expect(resultado.errores).toEqual([]);
    expect(resultado.filas[0].apellidos).toBe("Pérez López");
  });

  it("reporta las columnas obligatorias que falten sin lanzar una excepción", () => {
    const buffer = bufferDesdeFilas([
      ["Nombres", "Apellidos"],
      ["Ana", "Pérez"],
    ]);

    const resultado = parseAlumnosSheet(buffer);

    expect(resultado.filas).toEqual([]);
    expect(resultado.errores[0]).toContain("Código de alumno");
  });

  it("salta filas vacías y filas con datos obligatorios faltantes, sin detener el resto", () => {
    const buffer = bufferDesdeFilas([
      ["Codigo", "Nombres", "Apellidos", "Nivel", "Grado", "Seccion"],
      ["LB004", "Ana", "Pérez", "Primaria", "1° Grado", "A"],
      ["", "", "", "", "", ""],
      ["LB005", "", "Gómez", "Primaria", "1° Grado", "B"],
      ["LB006", "Luis", "Ramos", "Primaria", "1° Grado", "C"],
    ]);

    const resultado = parseAlumnosSheet(buffer);

    expect(resultado.filas.map((f) => f.codigo)).toEqual(["LB004", "LB006"]);
    expect(resultado.errores).toHaveLength(1);
    expect(resultado.errores[0]).toContain("Fila 4");
  });

  it("devuelve un error si el archivo no tiene filas de datos", () => {
    const buffer = bufferDesdeFilas([["Codigo", "Nombres", "Apellidos", "Nivel", "Grado", "Seccion"]]);

    const resultado = parseAlumnosSheet(buffer);

    expect(resultado.filas).toEqual([]);
    expect(resultado.errores[0]).toContain("no tiene filas de datos");
  });
});
