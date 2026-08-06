"use server";

import { redirect } from "next/navigation";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type EstadoAccion = { error?: string };

export async function crearIncidencia(_prev: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const usuario = await requireUsuario(["profesor"]);
  const supabase = await createClient();

  const alumnoId = String(formData.get("alumno") ?? "");
  const motivoId = String(formData.get("motivo") ?? "");
  const prioridad = String(formData.get("prioridad") ?? "");
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const acciones = String(formData.get("acciones") ?? "").trim();
  const involucrados = String(formData.get("involucrados") ?? "").trim();
  const evidencia = formData.get("evidencia");

  if (!alumnoId || !motivoId || !prioridad || !descripcion || !acciones) {
    return { error: "Completa todos los campos obligatorios." };
  }

  const { data: incidencia, error } = await supabase
    .from("incidencias")
    .insert({
      alumno_id: alumnoId,
      profesor_id: usuario.id,
      motivo_id: motivoId,
      prioridad,
      descripcion,
      acciones_tomadas: acciones,
      involucrados: involucrados || null,
    })
    .select("id")
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

  redirect(`/incidencias/${incidencia.id}`);
}

export async function marcarNotificacionLeida(id: string) {
  const usuario = await requireUsuario();
  const supabase = await createClient();
  await supabase.from("notificaciones").update({ leido: true }).eq("id", id).eq("usuario_id", usuario.id);
}
