"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnioActivo } from "@/lib/queries";

export type EstadoAccion = { error?: string };

export async function crearCasoDirecto(_prev: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const usuario = await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();

  const alumnoId = String(formData.get("alumno") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim();
  if (!alumnoId || !motivo) return { error: "Completa todos los campos." };

  const { data: caso, error } = await supabase
    .from("casos")
    .insert({
      alumno_id: alumnoId,
      incidencia_id: null,
      psicologo_id: usuario.id,
      psicologo_original_id: usuario.id,
      tipo: "caso_2",
      estado: "abierto",
    })
    .select("id")
    .single();

  if (error || !caso) return { error: "No se pudo abrir el caso." };

  await supabase.from("notas_seguimiento").insert({ caso_id: caso.id, autor_id: usuario.id, contenido: motivo });

  redirect(`/casos/${caso.id}`);
}

export async function abrirCasoDesdeIncidencia(incidenciaId: string) {
  const usuario = await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();

  const { data: inc } = await supabase
    .from("incidencias")
    .select("id, alumno_id")
    .eq("id", incidenciaId)
    .maybeSingle();
  if (!inc) return { error: "Incidencia no encontrada." };

  const anioActivo = await getAnioActivo(supabase);
  const { data: matricula } = await supabase
    .from("matriculas")
    .select("grado_id")
    .eq("alumno_id", inc.alumno_id)
    .eq("anio_academico_id", anioActivo?.id ?? "")
    .maybeSingle();

  const { data: asignacion } = await supabase
    .from("psicologo_grado")
    .select("usuario_id")
    .eq("grado_id", matricula?.grado_id ?? "")
    .maybeSingle();

  const psicologoId = asignacion?.usuario_id;
  if (!psicologoId) {
    return { error: "Ningún psicólogo cubre el grado de este alumno. Pide al administrador que lo configure." };
  }

  const { data: caso, error } = await supabase
    .from("casos")
    .insert({
      alumno_id: inc.alumno_id,
      incidencia_id: inc.id,
      psicologo_id: psicologoId,
      psicologo_original_id: psicologoId,
      tipo: "caso_1",
      estado: "abierto",
    })
    .select("id")
    .single();

  if (error || !caso) return { error: "No se pudo abrir el caso." };

  await supabase.from("incidencias").update({ estado: "derivada" }).eq("id", inc.id);

  redirect(`/casos/${caso.id}`);
}

export async function agregarNota(casoId: string, contenido: string) {
  const usuario = await requireUsuario(["psicologo", "jefe_psicologia"]);
  if (!contenido.trim()) return { error: "Escribe una nota." };
  const supabase = await createClient();

  const { error } = await supabase
    .from("notas_seguimiento")
    .insert({ caso_id: casoId, autor_id: usuario.id, contenido: contenido.trim() });

  if (error) return { error: "No se pudo agregar la nota." };
  revalidatePath(`/casos/${casoId}`);
  return {};
}

export async function cerrarCaso(casoId: string) {
  await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();

  const { error } = await supabase
    .from("casos")
    .update({ estado: "cerrado", fecha_cierre: new Date().toISOString().slice(0, 10) })
    .eq("id", casoId);

  if (error) return { error: "No se pudo cerrar el caso." };
  revalidatePath(`/casos/${casoId}`);
  return {};
}

export async function crearActaFirmada(_prev: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const usuario = await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();

  const casoId = String(formData.get("caso_id") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const hora = String(formData.get("hora") ?? "");
  const asistentes = String(formData.get("asistentes") ?? "").trim();
  const detalle = String(formData.get("detalle") ?? "").trim();
  const obsPsicologo = String(formData.get("obs_psicologo") ?? "").trim();
  const obsPadre = String(formData.get("obs_padre") ?? "").trim();
  const acuerdosPsicologo = String(formData.get("acuerdos_psicologo") ?? "").trim();
  const compromisosPadre = String(formData.get("compromisos_padre") ?? "").trim();
  const firmaPsicologo = String(formData.get("firma_psicologo") ?? "");
  const firmaPsicologoNombre = String(formData.get("firma_psicologo_nombre") ?? "").trim();
  const firmaPadre = String(formData.get("firma_padre") ?? "");
  const firmaPadreNombre = String(formData.get("firma_padre_nombre") ?? "").trim();

  if (!fecha || !hora || !asistentes || !detalle || !obsPsicologo || !obsPadre || !acuerdosPsicologo || !compromisosPadre) {
    return { error: "Completa todos los campos del acta." };
  }
  if (!firmaPsicologo || !firmaPsicologoNombre || !firmaPadre || !firmaPadreNombre) {
    return { error: "Faltan firmas: ambas partes deben firmar en pantalla." };
  }

  const { data: cita, error } = await supabase
    .from("citas_padres")
    .insert({
      caso_id: casoId,
      psicologo_id: usuario.id,
      fecha,
      hora,
      asistentes,
      detalle,
      obs_psicologo: obsPsicologo,
      obs_padre: obsPadre,
      acuerdos_psicologo: acuerdosPsicologo,
      compromisos_padre: compromisosPadre,
    })
    .select("id")
    .single();

  if (error || !cita) return { error: "No se pudo guardar el acta." };

  await supabase.from("firmas").insert([
    { cita_id: cita.id, firmante_tipo: "psicologo", firmante_nombre: firmaPsicologoNombre, firma_data: firmaPsicologo },
    { cita_id: cita.id, firmante_tipo: "padre", firmante_nombre: firmaPadreNombre, firma_data: firmaPadre },
  ]);

  redirect(`/casos/${casoId}`);
}

export async function crearActaAlumno(_prev: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const usuario = await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();

  const casoId = String(formData.get("caso_id") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const hora = String(formData.get("hora") ?? "");
  const detalle = String(formData.get("detalle") ?? "").trim();
  const observaciones = String(formData.get("observaciones") ?? "").trim();
  const acuerdos = String(formData.get("acuerdos") ?? "").trim();
  const firmaAlumno = String(formData.get("firma_alumno") ?? "");
  const firmaAlumnoNombre = String(formData.get("firma_alumno_nombre") ?? "").trim();

  if (!fecha || !hora || !detalle || !observaciones || !acuerdos) {
    return { error: "Completa todos los campos del acta." };
  }
  if (!firmaAlumno || !firmaAlumnoNombre) {
    return { error: "Falta la firma del alumno." };
  }

  const { error } = await supabase.from("actas_alumno").insert({
    caso_id: casoId,
    psicologo_id: usuario.id,
    fecha,
    hora,
    detalle,
    observaciones,
    acuerdos,
    firma_alumno_nombre: firmaAlumnoNombre,
    firma_alumno_data: firmaAlumno,
  });

  if (error) return { error: "No se pudo guardar el acta." };

  redirect(`/casos/${casoId}`);
}

export async function derivarCaso(casoId: string, nuevoPsicologoId: string, motivo: string) {
  const usuario = await requireUsuario(["jefe_psicologia"]);
  const supabase = await createClient();

  const { data: caso } = await supabase
    .from("casos")
    .select("psicologo_id, usuarios!casos_psicologo_id_fkey(nombre)")
    .eq("id", casoId)
    .maybeSingle();
  if (!caso) return { error: "Caso no encontrado." };

  const { data: nuevo } = await supabase.from("usuarios").select("nombre").eq("id", nuevoPsicologoId).maybeSingle();

  const { error } = await supabase
    .from("casos")
    .update({ psicologo_id: nuevoPsicologoId, estado: "derivado" })
    .eq("id", casoId);
  if (error) return { error: "No se pudo derivar el caso." };

  const anterior = (caso.usuarios as unknown as { nombre: string } | null)?.nombre ?? "el psicólogo anterior";
  await supabase.from("notas_seguimiento").insert({
    caso_id: casoId,
    autor_id: usuario.id,
    contenido: `Caso derivado de ${anterior} a ${nuevo?.nombre ?? "un nuevo psicólogo"}. Motivo: ${motivo}`,
  });

  revalidatePath(`/casos/${casoId}`);
  return {};
}
