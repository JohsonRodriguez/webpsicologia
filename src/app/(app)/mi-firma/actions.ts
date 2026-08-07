"use server";

import { revalidatePath } from "next/cache";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function guardarFirmaPsicologo(firmaData: string) {
  const usuario = await requireUsuario(["psicologo", "jefe_psicologia"]);
  if (!firmaData) return { error: "Dibuja tu firma antes de guardar." };
  const supabase = await createClient();

  const { error } = await supabase.from("usuarios").update({ firma_guardada: firmaData }).eq("id", usuario.id);
  if (error) return { error: "No se pudo guardar la firma." };

  revalidatePath("/mi-firma");
  return { ok: true };
}

export async function borrarFirmaPsicologo() {
  const usuario = await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();

  const { error } = await supabase.from("usuarios").update({ firma_guardada: null }).eq("id", usuario.id);
  if (error) return { error: "No se pudo borrar la firma." };

  revalidatePath("/mi-firma");
  return { ok: true };
}
