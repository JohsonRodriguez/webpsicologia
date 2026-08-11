"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type EstadoAccion = { error?: string; ok?: boolean };

export async function crearActaTutoria(_prev: EstadoAccion, formData: FormData): Promise<EstadoAccion> {
  const usuario = await requireUsuario(["profesor"]);
  const supabase = await createClient();

  const alumnoId = String(formData.get("alumno") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const hora = String(formData.get("hora") ?? "");
  const asistentes = String(formData.get("asistentes") ?? "").trim();
  const detalle = String(formData.get("detalle") ?? "").trim();
  const acuerdosTutor = String(formData.get("acuerdos_tutor") ?? "").trim();
  const compromisosPadre = String(formData.get("compromisos_padre") ?? "").trim();
  const firmaPadre = String(formData.get("firma_padre") ?? "");
  const firmaPadreNombre = String(formData.get("firma_padre_nombre") ?? "").trim();

  if (!alumnoId || !fecha || !hora || !asistentes || !detalle || !acuerdosTutor || !compromisosPadre) {
    return { error: "Completa todos los campos del acta." };
  }
  if (!firmaPadre || !firmaPadreNombre) {
    return { error: "Falta la firma del padre / madre / apoderado." };
  }

  const { data: acta, error } = await supabase
    .from("actas_tutoria")
    .insert({
      alumno_id: alumnoId,
      tutor_id: usuario.id,
      fecha,
      hora,
      asistentes,
      detalle,
      acuerdos_tutor: acuerdosTutor,
      compromisos_padre: compromisosPadre,
    })
    .select("id")
    .single();

  if (error || !acta) return { error: "No se pudo guardar el acta. Verifica que el alumno sea de tu aula de tutoría." };

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("firma_guardada")
    .eq("id", usuario.id)
    .maybeSingle();

  const firmas = [{ acta_id: acta.id, firmante_tipo: "padre", firmante_nombre: firmaPadreNombre, firma_data: firmaPadre }];
  if (perfil?.firma_guardada) {
    firmas.push({
      acta_id: acta.id,
      firmante_tipo: "tutor",
      firmante_nombre: usuario.nombre,
      firma_data: perfil.firma_guardada,
    });
  }
  await supabase.from("firmas_tutoria").insert(firmas);

  revalidatePath("/tutoria/actas");
  redirect("/tutoria/actas");
}
