"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnioActivo } from "@/lib/queries";

export type EstadoAccion = { error?: string; ok?: boolean };

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
  const acuerdosPsicologo = String(formData.get("acuerdos_psicologo") ?? "").trim();
  const compromisosPadre = String(formData.get("compromisos_padre") ?? "").trim();
  const firmaPsicologo = String(formData.get("firma_psicologo") ?? "");
  const firmaPsicologoNombre = String(formData.get("firma_psicologo_nombre") ?? "").trim();
  const firmaPadre = String(formData.get("firma_padre") ?? "");
  const firmaPadreNombre = String(formData.get("firma_padre_nombre") ?? "").trim();

  if (!fecha || !hora || !asistentes || !detalle || !acuerdosPsicologo || !compromisosPadre) {
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

  if (!fecha || !hora || !detalle) {
    return { error: "Completa todos los campos del acta." };
  }

  const { error } = await supabase.from("actas_alumno").insert({
    caso_id: casoId,
    psicologo_id: usuario.id,
    fecha,
    hora,
    detalle,
  });

  if (error) return { error: "No se pudo guardar el acta." };

  redirect(`/casos/${casoId}`);
}

export async function guardarObservacionesActaAlumno(actaId: string, observaciones: string) {
  await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();

  const { data: acta } = await supabase
    .from("actas_alumno")
    .select("caso_id, firma_alumno_data")
    .eq("id", actaId)
    .maybeSingle();

  if (!acta) return { error: "Acta no encontrada." };
  if (!acta.firma_alumno_data) {
    return { error: "Debes esperar a que el alumno firme antes de agregar tus observaciones." };
  }

  const { error } = await supabase
    .from("actas_alumno")
    .update({ observaciones: observaciones.trim() || null })
    .eq("id", actaId);

  if (error) return { error: "No se pudo guardar." };

  revalidatePath(`/casos/${acta.caso_id}`);
  return { ok: true };
}

export async function guardarActaAlumnoAlumno(
  actaId: string,
  _prev: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();

  const declaracion = String(formData.get("declaracion_alumno") ?? "").trim();
  const compromiso = String(formData.get("acuerdos") ?? "").trim();
  const firmaAlumno = String(formData.get("firma_alumno") ?? "");
  const firmaAlumnoNombre = String(formData.get("firma_alumno_nombre") ?? "").trim();

  if (!declaracion && !compromiso) {
    return { error: "Escribe la declaración o el compromiso antes de guardar." };
  }

  const firmando = firmaAlumno || firmaAlumnoNombre;
  if (firmando) {
    if (!declaracion || !compromiso) {
      return { error: "La declaración y el compromiso deben estar completos antes de firmar." };
    }
    if (!firmaAlumno || !firmaAlumnoNombre) {
      return { error: "Falta la firma del alumno." };
    }
  }

  const { data: actaAnterior } = await supabase
    .from("actas_alumno")
    .select("caso_id, firma_alumno_data")
    .eq("id", actaId)
    .maybeSingle();

  if (!actaAnterior) return { error: "Acta no encontrada." };
  if (actaAnterior.firma_alumno_data) return { error: "Esta acta ya fue firmada y no se puede modificar." };

  const { error } = await supabase
    .from("actas_alumno")
    .update({
      declaracion_alumno: declaracion || null,
      acuerdos: compromiso || null,
      ...(firmando
        ? {
            firma_alumno_nombre: firmaAlumnoNombre,
            firma_alumno_data: firmaAlumno,
            firma_fecha_hora: new Date().toISOString(),
          }
        : {}),
    })
    .eq("id", actaId);

  if (error) return { error: "No se pudo guardar. Intenta nuevamente." };

  revalidatePath(`/casos/${actaAnterior.caso_id}`);
  return { ok: true };
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
