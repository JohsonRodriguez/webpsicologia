import "server-only";
import * as XLSX from "xlsx";

export type FilaAlumnoImport = {
  fila: number;
  codigo: string;
  nombres: string;
  apellidos: string;
  nivel: string;
  grado: string;
  seccion: string;
};

export type ResultadoParseo = {
  filas: FilaAlumnoImport[];
  errores: string[];
};

function normalizarEncabezado(s: string) {
  return s
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const ALIAS: Record<string, string[]> = {
  codigo: ["codigo alumno", "codigo", "cod alumno", "cod"],
  apellidoPaterno: ["alumno apellido paterno", "apellido paterno"],
  apellidoMaterno: ["alumno apellido materno", "apellido materno"],
  apellidos: ["apellidos", "alumno apellidos"],
  nombres: ["alumno nombres", "nombres", "alumno nombre", "nombre"],
  nivel: ["nivel"],
  grado: ["grado"],
  seccion: ["seccion", "sección"],
};

function encontrarColumna(encabezados: string[], claves: string[]): number {
  for (const clave of claves) {
    const idx = encabezados.indexOf(clave);
    if (idx !== -1) return idx;
  }
  return -1;
}

/** Extrae el número inicial de un nombre de grado ("1° Grado de Primaria" -> 1, "2 Años" -> 2). */
export function ordenDesdeNombreGrado(nombre: string): number {
  const match = nombre.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

export function parseAlumnosSheet(buffer: ArrayBuffer): ResultadoParseo {
  const errores: string[] = [];
  let libro: XLSX.WorkBook;
  try {
    libro = XLSX.read(buffer, { type: "array" });
  } catch {
    return { filas: [], errores: ["El archivo no es un Excel válido (.xlsx)."] };
  }

  const nombreHoja = libro.SheetNames[0];
  if (!nombreHoja) return { filas: [], errores: ["El archivo no tiene hojas."] };

  const hoja = libro.Sheets[nombreHoja];
  const filasCrudas: unknown[][] = XLSX.utils.sheet_to_json(hoja, { header: 1, defval: "" });
  if (filasCrudas.length < 2) {
    return { filas: [], errores: ["El archivo no tiene filas de datos (solo encabezado o está vacío)."] };
  }

  const encabezados = (filasCrudas[0] as unknown[]).map((h) => normalizarEncabezado(String(h)));

  const col = {
    codigo: encontrarColumna(encabezados, ALIAS.codigo),
    apellidoPaterno: encontrarColumna(encabezados, ALIAS.apellidoPaterno),
    apellidoMaterno: encontrarColumna(encabezados, ALIAS.apellidoMaterno),
    apellidos: encontrarColumna(encabezados, ALIAS.apellidos),
    nombres: encontrarColumna(encabezados, ALIAS.nombres),
    nivel: encontrarColumna(encabezados, ALIAS.nivel),
    grado: encontrarColumna(encabezados, ALIAS.grado),
    seccion: encontrarColumna(encabezados, ALIAS.seccion),
  };

  const faltantes: string[] = [];
  if (col.codigo === -1) faltantes.push("Código de alumno");
  if (col.apellidoPaterno === -1 && col.apellidos === -1) faltantes.push("Apellidos");
  if (col.nombres === -1) faltantes.push("Nombres");
  if (col.nivel === -1) faltantes.push("Nivel");
  if (col.grado === -1) faltantes.push("Grado");
  if (col.seccion === -1) faltantes.push("Sección");

  if (faltantes.length) {
    return {
      filas: [],
      errores: [`No se encontraron estas columnas en el archivo: ${faltantes.join(", ")}.`],
    };
  }

  const filas: FilaAlumnoImport[] = [];
  for (let i = 1; i < filasCrudas.length; i++) {
    const fila = filasCrudas[i] as unknown[];
    const esVacia = fila.every((c) => String(c ?? "").trim() === "");
    if (esVacia) continue;

    const codigo = String(fila[col.codigo] ?? "").trim();
    const nombres = String(fila[col.nombres] ?? "").trim();
    const apellidos =
      col.apellidos !== -1
        ? String(fila[col.apellidos] ?? "").trim()
        : `${String(fila[col.apellidoPaterno] ?? "").trim()} ${String(fila[col.apellidoMaterno] ?? "").trim()}`.trim();
    const nivel = String(fila[col.nivel] ?? "").trim();
    const grado = String(fila[col.grado] ?? "").trim();
    const seccion = String(fila[col.seccion] ?? "").trim();

    const numeroFila = i + 1;
    if (!codigo || !nombres || !apellidos || !nivel || !grado || !seccion) {
      errores.push(`Fila ${numeroFila}: faltan datos obligatorios, se omitió.`);
      continue;
    }

    filas.push({ fila: numeroFila, codigo, nombres, apellidos, nivel, grado, seccion });
  }

  return { filas, errores };
}
