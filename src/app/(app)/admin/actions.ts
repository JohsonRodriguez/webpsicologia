"use server";

import { revalidatePath } from "next/cache";
import { requireUsuario } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { rolLabel, type Rol } from "@/lib/roles";
import { enviarCorreoRolAsignado } from "@/lib/email";
import { parseAlumnosSheet, ordenDesdeNombreGrado, type FilaAlumnoImport } from "@/lib/import-alumnos";
import { registrarAuditoria } from "@/lib/auditoria";

export type EstadoAccion = { error?: string; ok?: boolean };

function normalizar(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

export async function actualizarUsuario(id: string, cambios: { rol?: Rol | null; activo?: boolean }) {
  const actor = await requireUsuario(["administrador"]);
  const admin = createAdminClient();
  const { data: usuario, error } = await admin
    .from("usuarios")
    .update(cambios)
    .eq("id", id)
    .select("nombre, email")
    .single();
  if (error) return { error: "No se pudo actualizar el usuario." };

  await registrarAuditoria(admin, {
    usuarioId: actor.id,
    accion: "usuario.rol_actualizado",
    entidad: "usuario",
    entidadId: id,
    detalle: { cambios, afectado: usuario ? { nombre: usuario.nombre, email: usuario.email } : undefined },
  });

  if (cambios.rol && usuario) {
    await enviarCorreoRolAsignado({
      usuarioEmail: usuario.email,
      usuarioNombre: usuario.nombre,
      rolLabel: rolLabel(cambios.rol),
    });
  }

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function crearAlumno(_prev: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  await requireUsuario(["administrador"]);
  const admin = createAdminClient();

  const nombres = String(formData.get("nombres") ?? "").trim();
  const apellidos = String(formData.get("apellidos") ?? "").trim();
  const codigo = String(formData.get("codigo") ?? "").trim();
  const gradoId = String(formData.get("grado") ?? "");
  const seccionId = String(formData.get("seccion") ?? "");
  const anioId = String(formData.get("anio") ?? "");

  if (!nombres || !apellidos || !codigo || !gradoId || !seccionId || !anioId) {
    return { error: "Completa todos los campos." };
  }

  const { data: alumno, error } = await admin
    .from("alumnos")
    .insert({ nombres, apellidos, codigo })
    .select("id")
    .single();

  if (error || !alumno) return { error: "No se pudo crear el alumno (verifica que el código no esté repetido)." };

  const { error: matError } = await admin
    .from("matriculas")
    .insert({ alumno_id: alumno.id, anio_academico_id: anioId, grado_id: gradoId, seccion_id: seccionId });

  if (matError) return { error: "El alumno se creó pero no se pudo matricular." };

  revalidatePath("/admin/alumnos");
  return { ok: true };
}

export async function crearAnio(anio: number) {
  await requireUsuario(["administrador"]);
  const admin = createAdminClient();
  const { error } = await admin.from("anios_academicos").insert({ anio, activo: false });
  if (error) return { error: "No se pudo crear el año (¿ya existe?)." };
  revalidatePath("/admin/anios");
  revalidatePath("/admin/migracion");
  return { ok: true };
}

export async function activarAnio(id: string) {
  await requireUsuario(["administrador"]);
  const admin = createAdminClient();
  const { error } = await admin.from("anios_academicos").update({ activo: true }).eq("id", id);
  if (error) return { error: "No se pudo activar el año." };
  revalidatePath("/admin/anios");
  revalidatePath("/admin/migracion");
  return { ok: true };
}

export async function asignarPsicologoGrado(gradoId: string, usuarioId: string) {
  await requireUsuario(["administrador"]);
  const admin = createAdminClient();

  await admin.from("psicologo_grado").delete().eq("grado_id", gradoId);
  if (usuarioId) {
    const { error } = await admin.from("psicologo_grado").insert({ grado_id: gradoId, usuario_id: usuarioId });
    if (error) return { error: "No se pudo actualizar la asignación." };
  }
  revalidatePath("/admin/config");
  return { ok: true };
}

export async function crearMotivo(nombre: string) {
  await requireUsuario(["administrador"]);
  if (!nombre.trim()) return { error: "Escribe un nombre." };
  const admin = createAdminClient();
  const { error } = await admin.from("catalogo_motivos").insert({ nombre: nombre.trim() });
  if (error) return { error: "No se pudo crear el motivo (¿ya existe?)." };
  revalidatePath("/admin/config");
  return { ok: true };
}

export async function alternarMotivo(id: string, activo: boolean) {
  await requireUsuario(["administrador"]);
  const admin = createAdminClient();
  const { error } = await admin.from("catalogo_motivos").update({ activo }).eq("id", id);
  if (error) return { error: "No se pudo actualizar el motivo." };
  revalidatePath("/admin/config");
  return { ok: true };
}

export async function ejecutarMigracion(anioDestinoId: string) {
  await requireUsuario(["administrador"]);
  const admin = createAdminClient();

  const { data: activo } = await admin.from("anios_academicos").select("id").eq("activo", true).maybeSingle();
  if (!activo) return { error: "No hay año activo." };

  const { data: niveles } = await admin.from("niveles").select("id, orden").order("orden");
  const { data: grados } = await admin.from("grados").select("id, nivel_id, orden").order("orden");
  const ordenNivel = new Map((niveles ?? []).map((n) => [n.id, n.orden]));
  const secuencia = [...(grados ?? [])].sort((a, b) => {
    const na = ordenNivel.get(a.nivel_id) ?? 0;
    const nb = ordenNivel.get(b.nivel_id) ?? 0;
    return na !== nb ? na - nb : a.orden - b.orden;
  });
  const idxPorGrado = new Map(secuencia.map((g, i) => [g.id, i]));

  const { data: secciones } = await admin.from("secciones").select("id, grado_id, nombre");
  const { data: matriculasOrigen } = await admin
    .from("matriculas")
    .select("alumno_id, grado_id, seccion_id")
    .eq("anio_academico_id", activo.id);

  const { data: yaMigrados } = await admin.from("matriculas").select("alumno_id").eq("anio_academico_id", anioDestinoId);
  const yaMigradosSet = new Set((yaMigrados ?? []).map((m) => m.alumno_id));

  let creadas = 0;
  let egresadas = 0;
  const nuevasFilas: { alumno_id: string; anio_academico_id: string; grado_id: string; seccion_id: string }[] = [];

  for (const m of matriculasOrigen ?? []) {
    if (yaMigradosSet.has(m.alumno_id)) continue;
    const idx = idxPorGrado.get(m.grado_id);
    if (idx === undefined || idx === secuencia.length - 1) {
      egresadas++;
      continue;
    }
    const siguienteGradoId = secuencia[idx + 1].id;
    const seccionOrigenNombre = (secciones ?? []).find((s) => s.id === m.seccion_id)?.nombre;
    const seccionDestino =
      (secciones ?? []).find((s) => s.grado_id === siguienteGradoId && s.nombre === seccionOrigenNombre) ??
      (secciones ?? []).find((s) => s.grado_id === siguienteGradoId);
    if (!seccionDestino) continue;

    nuevasFilas.push({
      alumno_id: m.alumno_id,
      anio_academico_id: anioDestinoId,
      grado_id: siguienteGradoId,
      seccion_id: seccionDestino.id,
    });
    creadas++;
  }

  if (nuevasFilas.length) {
    const { error } = await admin.from("matriculas").insert(nuevasFilas);
    if (error) return { error: "No se pudo completar la migración." };
  }

  revalidatePath("/admin/migracion");
  revalidatePath("/admin/anios");
  return { ok: true, creadas, egresadas };
}

export type ResultadoImportacion = {
  error?: string;
  ok?: boolean;
  creados?: number;
  actualizados?: number;
  matriculados?: number;
  advertencias?: string[];
};

export async function importarAlumnosExcel(
  _prev: ResultadoImportacion,
  formData: FormData,
): Promise<ResultadoImportacion> {
  await requireUsuario(["administrador"]);
  const admin = createAdminClient();

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Selecciona un archivo Excel (.xlsx)." };
  }

  const buffer = await archivo.arrayBuffer();
  const { filas, errores: erroresParseo } = parseAlumnosSheet(buffer);
  if (!filas.length) {
    return { error: erroresParseo[0] ?? "No se encontraron filas válidas en el archivo." };
  }

  const { data: anioActivo } = await admin.from("anios_academicos").select("id").eq("activo", true).maybeSingle();
  if (!anioActivo) return { error: "No hay un año académico activo. Actívalo primero en Años académicos." };

  // Si el mismo código aparece más de una vez en el archivo, nos quedamos con la última fila.
  const porCodigo = new Map<string, FilaAlumnoImport>();
  const advertencias: string[] = [...erroresParseo];
  for (const f of filas) {
    if (porCodigo.has(f.codigo)) advertencias.push(`Código ${f.codigo} repetido en el archivo; se usó la última fila.`);
    porCodigo.set(f.codigo, f);
  }
  const filasValidas = [...porCodigo.values()];

  // --- Fase A: resolver (o crear) niveles, grados y secciones. Son pocos valores
  // únicos aunque el archivo tenga cientos de alumnos, así que ir uno por uno es rápido. ---
  const { data: nivelesExistentes } = await admin.from("niveles").select("id, nombre, orden");
  const { data: gradosExistentes } = await admin.from("grados").select("id, nivel_id, nombre, orden");
  const { data: seccionesExistentes } = await admin.from("secciones").select("id, grado_id, nombre");

  const nivelPorNombre = new Map((nivelesExistentes ?? []).map((n) => [normalizar(n.nombre), n]));
  const gradoPorClave = new Map((gradosExistentes ?? []).map((g) => [`${g.nivel_id}::${normalizar(g.nombre)}`, g]));
  const seccionPorClave = new Map(
    (seccionesExistentes ?? []).map((s) => [`${s.grado_id}::${normalizar(s.nombre)}`, s]),
  );
  let maxOrdenNivel = Math.max(0, ...(nivelesExistentes ?? []).map((n) => n.orden));

  const gradoYSeccionPorFila = new Map<string, { gradoId: string; seccionId: string }>();

  for (const f of filasValidas) {
    const nivelKey = normalizar(f.nivel);
    let nivel = nivelPorNombre.get(nivelKey);
    if (!nivel) {
      const { data, error } = await admin
        .from("niveles")
        .insert({ nombre: f.nivel, orden: ++maxOrdenNivel })
        .select("id, nombre, orden")
        .single();
      if (error || !data) {
        advertencias.push(`Fila ${f.fila}: no se pudo crear el nivel "${f.nivel}".`);
        continue;
      }
      nivel = data;
      nivelPorNombre.set(nivelKey, nivel);
    }

    const gradoKey = `${nivel.id}::${normalizar(f.grado)}`;
    let grado = gradoPorClave.get(gradoKey);
    if (!grado) {
      const { data, error } = await admin
        .from("grados")
        .insert({ nivel_id: nivel.id, nombre: f.grado, orden: ordenDesdeNombreGrado(f.grado) })
        .select("id, nivel_id, nombre, orden")
        .single();
      if (error || !data) {
        advertencias.push(`Fila ${f.fila}: no se pudo crear el grado "${f.grado}".`);
        continue;
      }
      grado = data;
      gradoPorClave.set(gradoKey, grado);
    }

    const seccionKey = `${grado.id}::${normalizar(f.seccion)}`;
    let seccion = seccionPorClave.get(seccionKey);
    if (!seccion) {
      const { data, error } = await admin
        .from("secciones")
        .insert({ grado_id: grado.id, nombre: f.seccion })
        .select("id, grado_id, nombre")
        .single();
      if (error || !data) {
        advertencias.push(`Fila ${f.fila}: no se pudo crear la sección "${f.seccion}".`);
        continue;
      }
      seccion = data;
      seccionPorClave.set(seccionKey, seccion);
    }

    gradoYSeccionPorFila.set(f.codigo, { gradoId: grado.id, seccionId: seccion.id });
  }

  // --- Fase B: alumnos, en un solo upsert por código (evita cientos de idas y vueltas). ---
  const { data: alumnosAntes } = await admin.from("alumnos").select("codigo");
  const codigosExistentesAntes = new Set((alumnosAntes ?? []).map((a) => a.codigo));

  const filasConGradoValido = filasValidas.filter((f) => gradoYSeccionPorFila.has(f.codigo));
  const alumnosParaGuardar = filasConGradoValido.map((f) => ({
    codigo: f.codigo,
    nombres: f.nombres,
    apellidos: f.apellidos,
  }));

  const { data: alumnosGuardados, error: alumnosError } = await admin
    .from("alumnos")
    .upsert(alumnosParaGuardar, { onConflict: "codigo" })
    .select("id, codigo");

  if (alumnosError) {
    return { error: `No se pudieron guardar los alumnos: ${alumnosError.message}` };
  }

  const idPorCodigo = new Map((alumnosGuardados ?? []).map((a) => [a.codigo, a.id]));
  const creados = alumnosParaGuardar.filter((a) => !codigosExistentesAntes.has(a.codigo)).length;
  const actualizados = alumnosParaGuardar.length - creados;

  // --- Fase C: matrículas del año activo, también en un solo upsert. ---
  const matriculasParaGuardar = filasConGradoValido
    .map((f) => {
      const alumnoId = idPorCodigo.get(f.codigo);
      const gs = gradoYSeccionPorFila.get(f.codigo);
      if (!alumnoId || !gs) return null;
      return { alumno_id: alumnoId, anio_academico_id: anioActivo.id, grado_id: gs.gradoId, seccion_id: gs.seccionId };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  let matriculados = 0;
  if (matriculasParaGuardar.length) {
    const { error: matError, count } = await admin
      .from("matriculas")
      .upsert(matriculasParaGuardar, { onConflict: "alumno_id,anio_academico_id", count: "exact" });
    if (matError) {
      advertencias.push(`No se pudieron guardar algunas matrículas: ${matError.message}`);
    } else {
      matriculados = count ?? matriculasParaGuardar.length;
    }
  }

  revalidatePath("/admin/alumnos");
  revalidatePath("/admin/grados");
  revalidatePath("/admin/config");
  revalidatePath("/admin/migracion");

  return { ok: true, creados, actualizados, matriculados, advertencias };
}

export async function crearGrado(nivelId: string, nombre: string) {
  await requireUsuario(["administrador"]);
  if (!nombre.trim()) return { error: "Escribe un nombre para el grado." };
  const admin = createAdminClient();

  const { data: existentes } = await admin.from("grados").select("orden").eq("nivel_id", nivelId);
  const maxOrden = Math.max(0, ...(existentes ?? []).map((g) => g.orden));
  const orden = ordenDesdeNombreGrado(nombre) || maxOrden + 1;

  const { error } = await admin.from("grados").insert({ nivel_id: nivelId, nombre: nombre.trim(), orden });
  if (error) return { error: "No se pudo crear el grado (¿ya existe uno con ese nombre en este nivel?)." };
  revalidatePath("/admin/grados");
  return { ok: true };
}

export async function renombrarGrado(id: string, nombre: string) {
  await requireUsuario(["administrador"]);
  if (!nombre.trim()) return { error: "El nombre no puede estar vacío." };
  const admin = createAdminClient();
  const { error } = await admin.from("grados").update({ nombre: nombre.trim() }).eq("id", id);
  if (error) return { error: "No se pudo renombrar el grado." };
  revalidatePath("/admin/grados");
  return { ok: true };
}

export async function eliminarGrado(id: string) {
  const actor = await requireUsuario(["administrador"]);
  const admin = createAdminClient();

  const { count } = await admin.from("matriculas").select("id", { count: "exact", head: true }).eq("grado_id", id);
  if (count && count > 0) {
    return { error: `No se puede eliminar: hay ${count} alumno(s) matriculados en este grado.` };
  }

  const { data: grado } = await admin.from("grados").select("nombre").eq("id", id).maybeSingle();
  const { error } = await admin.from("grados").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar el grado." };

  await registrarAuditoria(admin, {
    usuarioId: actor.id,
    accion: "grado.eliminado",
    entidad: "grado",
    entidadId: id,
    detalle: { nombre: grado?.nombre },
  });

  revalidatePath("/admin/grados");
  return { ok: true };
}

export async function crearSeccion(gradoId: string, nombre: string) {
  await requireUsuario(["administrador"]);
  if (!nombre.trim()) return { error: "Escribe un nombre para la sección." };
  const admin = createAdminClient();
  const { error } = await admin.from("secciones").insert({ grado_id: gradoId, nombre: nombre.trim() });
  if (error) return { error: "No se pudo crear la sección (¿ya existe una con ese nombre en este grado?)." };
  revalidatePath("/admin/grados");
  return { ok: true };
}

export async function renombrarSeccion(id: string, nombre: string) {
  await requireUsuario(["administrador"]);
  if (!nombre.trim()) return { error: "El nombre no puede estar vacío." };
  const admin = createAdminClient();
  const { error } = await admin.from("secciones").update({ nombre: nombre.trim() }).eq("id", id);
  if (error) return { error: "No se pudo renombrar la sección." };
  revalidatePath("/admin/grados");
  return { ok: true };
}

export async function eliminarSeccion(id: string) {
  const actor = await requireUsuario(["administrador"]);
  const admin = createAdminClient();

  const { count } = await admin.from("matriculas").select("id", { count: "exact", head: true }).eq("seccion_id", id);
  if (count && count > 0) {
    return { error: `No se puede eliminar: hay ${count} alumno(s) matriculados en esta sección.` };
  }

  const { data: seccion } = await admin.from("secciones").select("nombre").eq("id", id).maybeSingle();
  const { error } = await admin.from("secciones").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar la sección." };

  await registrarAuditoria(admin, {
    usuarioId: actor.id,
    accion: "seccion.eliminada",
    entidad: "seccion",
    entidadId: id,
    detalle: { nombre: seccion?.nombre },
  });

  revalidatePath("/admin/grados");
  return { ok: true };
}
