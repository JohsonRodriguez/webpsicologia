"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnioActivo } from "@/lib/queries";
import { enviarCorreoIncidenciaAsignada } from "@/lib/email";

export type EstadoAccion = { error?: string; ok?: boolean };

export async function crearIncidencia(_prev: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const usuario = await requireUsuario(["profesor"]);
  const supabase = await createClient();

  const alumnoId = String(formData.get("alumno") ?? "");
  const motivoId = String(formData.get("motivo") ?? "");
  const motivoOtro = String(formData.get("motivo_otro") ?? "").trim();
  const prioridad = String(formData.get("prioridad") ?? "");
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const acciones = String(formData.get("acciones") ?? "").trim();
  const involucrados = String(formData.get("involucrados") ?? "").trim();
  const evidencia = formData.get("evidencia");

  if (!alumnoId || !motivoId || !prioridad || !descripcion || !acciones) {
    return { error: "Completa todos los campos obligatorios." };
  }

  const { data: motivoSeleccionado } = await supabase
    .from("catalogo_motivos")
    .select("nombre")
    .eq("id", motivoId)
    .maybeSingle();

  if (motivoSeleccionado?.nombre === "Otro" && !motivoOtro) {
    return { error: "Especifica el motivo." };
  }

  const { data: incidencia, error } = await supabase
    .from("incidencias")
    .insert({
      alumno_id: alumnoId,
      profesor_id: usuario.id,
      motivo_id: motivoId,
      motivo_otro: motivoSeleccionado?.nombre === "Otro" ? motivoOtro : null,
      prioridad,
      descripcion,
      acciones_tomadas: acciones,
      involucrados: involucrados || null,
    })
    .select("id, alumnos(nombres, apellidos), catalogo_motivos(nombre)")
    .single();

  if (error || !incidencia) {
    return { error: "No se pudo registrar la incidencia. Intenta nuevamente." };
  }

  if (evidencia instanceof File && evidencia.size > 0) {
    const path = `${incidencia.id}/${Date.now()}-${evidencia.name}`;
    const { error: uploadError } = await supabase.storage.from("evidencias").upload(path, evidencia);
    if (!uploadError) {
      await supabase.from("evidencias").insert({ incidencia_id: incidencia.id, archivo_url: path });
    }
  }

  await notificarPsicologoPorCorreo(supabase, {
    alumnoId,
    alumno: incidencia.alumnos as unknown as { nombres: string; apellidos: string } | null,
    motivo: incidencia.catalogo_motivos as unknown as { nombre: string } | null,
    motivoOtro: motivoSeleccionado?.nombre === "Otro" ? motivoOtro : null,
    prioridad,
  });

  redirect(`/incidencias/${incidencia.id}`);
}

export async function actualizarIncidencia(
  incidenciaId: string,
  _prev: EstadoAccion,
  formData: FormData,
): Promise<EstadoAccion> {
  const usuario = await requireUsuario(["profesor"]);
  const supabase = await createClient();

  const { data: inc } = await supabase
    .from("incidencias")
    .select("id, profesor_id")
    .eq("id", incidenciaId)
    .maybeSingle();

  if (!inc || inc.profesor_id !== usuario.id) {
    return { error: "No tienes permiso para editar esta incidencia." };
  }

  const { count } = await supabase
    .from("casos")
    .select("id", { count: "exact", head: true })
    .eq("incidencia_id", incidenciaId);

  if (count && count > 0) {
    return { error: "El psicólogo ya tomó este caso: la incidencia ya no se puede editar." };
  }

  const motivoId = String(formData.get("motivo") ?? "");
  const motivoOtro = String(formData.get("motivo_otro") ?? "").trim();
  const prioridad = String(formData.get("prioridad") ?? "");
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const acciones = String(formData.get("acciones") ?? "").trim();
  const involucrados = String(formData.get("involucrados") ?? "").trim();
  const evidencia = formData.get("evidencia");

  if (!motivoId || !prioridad || !descripcion || !acciones) {
    return { error: "Completa todos los campos obligatorios." };
  }

  const { data: motivoSeleccionado } = await supabase
    .from("catalogo_motivos")
    .select("nombre")
    .eq("id", motivoId)
    .maybeSingle();

  if (motivoSeleccionado?.nombre === "Otro" && !motivoOtro) {
    return { error: "Especifica el motivo." };
  }

  const { error } = await supabase
    .from("incidencias")
    .update({
      motivo_id: motivoId,
      motivo_otro: motivoSeleccionado?.nombre === "Otro" ? motivoOtro : null,
      prioridad,
      descripcion,
      acciones_tomadas: acciones,
      involucrados: involucrados || null,
    })
    .eq("id", incidenciaId);

  if (error) {
    return { error: "No se pudo actualizar la incidencia. Intenta nuevamente." };
  }

  if (evidencia instanceof File && evidencia.size > 0) {
    const path = `${incidenciaId}/${Date.now()}-${evidencia.name}`;
    const { error: uploadError } = await supabase.storage.from("evidencias").upload(path, evidencia);
    if (!uploadError) {
      await supabase.from("evidencias").insert({ incidencia_id: incidenciaId, archivo_url: path });
    }
  }

  revalidatePath(`/incidencias/${incidenciaId}`);
  return { ok: true };
}

async function notificarPsicologoPorCorreo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    alumnoId: string;
    alumno: { nombres: string; apellidos: string } | null;
    motivo: { nombre: string } | null;
    motivoOtro: string | null;
    prioridad: string;
  },
) {
  const anioActivo = await getAnioActivo(supabase);
  const { data: matricula } = await supabase
    .from("matriculas")
    .select("grado_id")
    .eq("alumno_id", params.alumnoId)
    .eq("anio_academico_id", anioActivo?.id ?? "")
    .maybeSingle();
  if (!matricula) return;

  const { data: asignacion } = await supabase
    .from("psicologo_grado")
    .select("usuarios(nombre, email)")
    .eq("grado_id", matricula.grado_id)
    .maybeSingle();
  const psicologo = asignacion?.usuarios as unknown as { nombre: string; email: string } | null;
  if (!psicologo || !params.alumno) return;

  await enviarCorreoIncidenciaAsignada({
    psicologoEmail: psicologo.email,
    psicologoNombre: psicologo.nombre,
    alumnoNombre: `${params.alumno.nombres} ${params.alumno.apellidos}`,
    motivo: params.motivoOtro || params.motivo?.nombre || "—",
    prioridad: params.prioridad,
  });
}

export async function marcarNotificacionLeida(id: string) {
  const usuario = await requireUsuario();
  const supabase = await createClient();
  await supabase.from("notificaciones").update({ leido: true }).eq("id", id).eq("usuario_id", usuario.id);
}
