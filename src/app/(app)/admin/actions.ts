"use server";

import { revalidatePath } from "next/cache";
import { requireUsuario } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { rolLabel, type Rol } from "@/lib/roles";
import { enviarCorreoRolAsignado } from "@/lib/email";

export type EstadoAccion = { error?: string; ok?: boolean };

export async function actualizarUsuario(id: string, cambios: { rol?: Rol | null; activo?: boolean }) {
  await requireUsuario(["administrador"]);
  const admin = createAdminClient();
  const { data: usuario, error } = await admin
    .from("usuarios")
    .update(cambios)
    .eq("id", id)
    .select("nombre, email")
    .single();
  if (error) return { error: "No se pudo actualizar el usuario." };

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
