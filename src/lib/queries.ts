import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type DB = SupabaseClient<Database>;

export async function getAnioActivo(supabase: DB) {
  const { data } = await supabase
    .from("anios_academicos")
    .select("id, anio, activo")
    .eq("activo", true)
    .maybeSingle();
  return data;
}

export async function getAnios(supabase: DB) {
  const { data } = await supabase
    .from("anios_academicos")
    .select("id, anio, activo")
    .order("anio", { ascending: false });
  return data ?? [];
}

export type MatriculaInfo = {
  alumnoId: string;
  gradoId: string;
  gradoNombre: string;
  seccionId: string;
  seccionNombre: string;
  nivelId: string;
  nivelNombre: string;
};

/**
 * Matrícula de cada alumno para un año dado (por defecto el año activo), indexada por alumno_id.
 * Si se pasa `alumnoIds`, acota la consulta a esos alumnos en vez de traer la matrícula
 * de todo el colegio (útil en pantallas que solo muestran un puñado de alumnos, como el dashboard).
 */
export async function getMatriculasPorAlumno(supabase: DB, anioAcademicoId?: string, alumnoIds?: string[]) {
  let anioId = anioAcademicoId;
  if (!anioId) {
    const activo = await getAnioActivo(supabase);
    anioId = activo?.id;
  }
  if (!anioId) return new Map<string, MatriculaInfo>();
  if (alumnoIds && alumnoIds.length === 0) return new Map<string, MatriculaInfo>();

  let query = supabase
    .from("matriculas")
    .select(
      "alumno_id, grado_id, seccion_id, grados(nombre, nivel_id, niveles(nombre)), secciones(nombre)",
    )
    .eq("anio_academico_id", anioId);
  if (alumnoIds) query = query.in("alumno_id", alumnoIds);
  const { data } = await query;

  const map = new Map<string, MatriculaInfo>();
  for (const row of data ?? []) {
    const grados = row.grados as unknown as { nombre: string; nivel_id: string; niveles: { nombre: string } | null } | null;
    const secciones = row.secciones as unknown as { nombre: string } | null;
    if (!grados || !secciones) continue;
    map.set(row.alumno_id, {
      alumnoId: row.alumno_id,
      gradoId: row.grado_id,
      gradoNombre: grados.nombre,
      seccionId: row.seccion_id,
      seccionNombre: secciones.nombre,
      nivelId: grados.nivel_id,
      nivelNombre: grados.niveles?.nombre ?? "",
    });
  }
  return map;
}

export async function getCatalogoMotivos(supabase: DB) {
  const { data } = await supabase
    .from("catalogo_motivos")
    .select("id, nombre, activo")
    .eq("activo", true)
    .order("nombre");
  return data ?? [];
}

export type EstructuraAcademica = {
  niveles: { id: string; nombre: string; orden: number }[];
  grados: { id: string; nivel_id: string; nombre: string; orden: number }[];
  secciones: { id: string; grado_id: string; nombre: string }[];
};

export async function getEstructuraAcademica(supabase: DB): Promise<EstructuraAcademica> {
  const [{ data: niveles }, { data: grados }, { data: secciones }] = await Promise.all([
    supabase.from("niveles").select("id, nombre, orden").order("orden"),
    supabase.from("grados").select("id, nivel_id, nombre, orden").order("orden"),
    supabase.from("secciones").select("id, grado_id, nombre").order("nombre"),
  ]);
  return { niveles: niveles ?? [], grados: grados ?? [], secciones: secciones ?? [] };
}

export function nombreAlumno(a: { nombres: string; apellidos: string }) {
  return `${a.nombres} ${a.apellidos}`;
}

/** Tamaño de página para las listas paginadas de casos/incidencias. */
export const TAMANO_PAGINA_LISTA = 20;

/** Convierte un número de página (1-indexado) en el rango [from, to] para `.range()`. */
export function rangoPagina(page: number) {
  const from = (page - 1) * TAMANO_PAGINA_LISTA;
  const to = from + TAMANO_PAGINA_LISTA - 1;
  return { from, to };
}

export function totalPaginas(count: number | null) {
  return Math.max(1, Math.ceil((count ?? 0) / TAMANO_PAGINA_LISTA));
}

/** Escapa los comodines de ILIKE (%, _) para que el texto del usuario se busque de forma literal. */
function escaparLike(valor: string) {
  return valor.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/**
 * Filtro OR (para `.or(..., { foreignTable: "alumnos" })`) que busca `q` en nombres o apellidos
 * del alumno embebido. El valor va entre comillas dobles porque la sintaxis de `.or()` de
 * PostgREST usa comas y paréntesis como separadores; sin comillas, un texto de búsqueda que
 * contenga esos caracteres rompería el filtro.
 */
export function filtroNombreAlumno(q: string) {
  const needle = escaparLike(q).replace(/"/g, '\\"');
  return `nombres.ilike."%${needle}%",apellidos.ilike."%${needle}%"`;
}
