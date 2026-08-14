"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type EstadoAccion = { error?: string; ok?: boolean };

function ipDelSolicitante(hdrs: Headers) {
  const forwarded = hdrs.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return hdrs.get("x-real-ip") ?? "desconocida";
}

export async function crearReunionBienestar(_prev: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const usuario = await requireUsuario(["coordinador_bienestar"]);
  const supabase = await createClient();
  const hdrs = await headers();

  const alumnoId = String(formData.get("alumno") ?? "");
  const periodo = String(formData.get("periodo") ?? "").trim();
  const modalidad = String(formData.get("modalidad") ?? "");
  const anioAcademicoId = String(formData.get("anio_academico_id") ?? "");

  if (!alumnoId || !periodo || !modalidad || !anioAcademicoId) {
    return { error: "Completa todos los campos del acta." };
  }

  // Virtual: el padre llena su observación y firma más tarde desde un
  // enlace propio (token de un solo uso); el coordinador recién escribe su
  // observación de cierre cuando el padre ya respondió. Ver
  // enviarObservacionPadre y cerrarReunionBienestar.
  if (modalidad === "virtual") {
    const { data: reunion, error } = await supabase
      .from("reuniones_bienestar")
      .insert({
        alumno_id: alumnoId,
        coordinador_id: usuario.id,
        anio_academico_id: anioAcademicoId,
        periodo,
        modalidad,
        fecha_hora: new Date().toISOString(),
        estado: "pendiente",
        token: randomUUID(),
      })
      .select("id")
      .single();

    if (error || !reunion) {
      return { error: "No se pudo generar el enlace. Verifica que el alumno sea de tu nivel asignado." };
    }
    revalidatePath("/bienestar");
    redirect(`/bienestar/${reunion.id}`);
  }

  const observacionPadre = String(formData.get("observacion_padre") ?? "").trim();
  const observacionCoordinador = String(formData.get("observacion_coordinador") ?? "").trim();
  const firmaPadre = String(formData.get("firma_padre") ?? "");
  const firmaPadreNombre = String(formData.get("firma_padre_nombre") ?? "").trim();

  if (!observacionPadre || !observacionCoordinador) {
    return { error: "Completa todos los campos del acta." };
  }
  if (!firmaPadre || !firmaPadreNombre) {
    return { error: "Falta la firma del padre / madre / apoderado." };
  }

  const { data: reunion, error } = await supabase
    .from("reuniones_bienestar")
    .insert({
      alumno_id: alumnoId,
      coordinador_id: usuario.id,
      anio_academico_id: anioAcademicoId,
      periodo,
      modalidad,
      fecha_hora: new Date().toISOString(),
      observacion_padre: observacionPadre,
      observacion_coordinador: observacionCoordinador,
      estado: "concluida",
    })
    .select("id")
    .single();

  if (error || !reunion) {
    return { error: "No se pudo guardar el acta. Verifica que el alumno sea de tu nivel asignado." };
  }

  const { error: errorFirma } = await supabase.from("firmas_bienestar").insert({
    reunion_id: reunion.id,
    firmante_nombre: firmaPadreNombre,
    firma_data: firmaPadre,
    ip: ipDelSolicitante(hdrs),
  });
  if (errorFirma) return { error: "El acta se guardó, pero no se pudo registrar la firma." };

  revalidatePath("/bienestar");
  redirect(`/bienestar/${reunion.id}`);
}

// Sin sesión: la llama el padre de familia desde el enlace público
// /bienestar-padre/[token]. El token (uuid random, un solo uso, se anula al
// responder) es la única autorización — por eso usa el cliente admin en vez
// de una policy RLS para el rol anon.
export async function enviarObservacionPadre(token: string, _prev: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const observacionPadre = String(formData.get("observacion_padre") ?? "").trim();
  const firmaPadre = String(formData.get("firma_padre") ?? "");
  const firmaPadreNombre = String(formData.get("firma_padre_nombre") ?? "").trim();

  if (!observacionPadre) return { error: "Escribe tu observación." };
  if (!firmaPadre || !firmaPadreNombre) return { error: "Falta la firma." };

  const hdrs = await headers();
  const admin = createAdminClient();

  const { error } = await admin.rpc("registrar_observacion_padre_bienestar", {
    p_token: token,
    p_observacion_padre: observacionPadre,
    p_firma_data: firmaPadre,
    p_firmante_nombre: firmaPadreNombre,
    p_ip: ipDelSolicitante(hdrs),
  });

  if (error?.message.includes("enlace_no_disponible")) {
    return { error: "Este enlace ya no está disponible." };
  }
  if (error?.message.includes("observacion_invalida")) {
    return { error: "La observación debe tener entre 1 y 4000 caracteres." };
  }
  if (error?.message.includes("firmante_invalido")) {
    return { error: "El nombre del firmante es demasiado largo." };
  }
  if (error?.message.includes("firma_invalida")) {
    return { error: "La firma no es válida o supera el tamaño permitido." };
  }
  if (error) return { error: "No se pudo guardar tu respuesta. Intenta nuevamente." };

  return { ok: true };
}

export async function cerrarReunionBienestar(reunionId: string, _prev: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  await requireUsuario(["coordinador_bienestar"]);
  const supabase = await createClient();

  const observacionCoordinador = String(formData.get("observacion_coordinador") ?? "").trim();
  if (!observacionCoordinador) return { error: "Escribe tu observación de cierre." };

  const { data: reunion } = await supabase
    .from("reuniones_bienestar")
    .select("id, observacion_padre")
    .eq("id", reunionId)
    .maybeSingle();

  if (!reunion) return { error: "No se encontró la reunión." };
  if (!reunion.observacion_padre) return { error: "Aún no puedes cerrar el acta: el padre no ha respondido." };

  const { error } = await supabase
    .from("reuniones_bienestar")
    .update({ observacion_coordinador: observacionCoordinador, estado: "concluida" })
    .eq("id", reunionId);
  if (error) return { error: "No se pudo concluir el acta." };

  revalidatePath("/bienestar");
  revalidatePath(`/bienestar/${reunionId}`);
  redirect(`/bienestar/${reunionId}`);
}
