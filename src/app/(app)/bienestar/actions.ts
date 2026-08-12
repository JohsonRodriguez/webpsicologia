"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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
  const observacionPadre = String(formData.get("observacion_padre") ?? "").trim();
  const observacionCoordinador = String(formData.get("observacion_coordinador") ?? "").trim();
  const firmaPadre = String(formData.get("firma_padre") ?? "");
  const firmaPadreNombre = String(formData.get("firma_padre_nombre") ?? "").trim();
  const anioAcademicoId = String(formData.get("anio_academico_id") ?? "");

  if (!alumnoId || !periodo || !modalidad || !observacionPadre || !observacionCoordinador || !anioAcademicoId) {
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
