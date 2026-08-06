import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Rol } from "@/lib/roles";

export type { Rol };
export type UsuarioActual = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
};

/** Usuario autenticado con rol asignado y cuenta activa, o null. */
export async function getUsuarioActual(): Promise<UsuarioActual | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("usuarios")
    .select("id, nombre, email, rol, activo")
    .eq("id", user.id)
    .maybeSingle();

  if (!data || !data.activo || !data.rol) return null;

  return { id: data.id, nombre: data.nombre, email: data.email, rol: data.rol as Rol };
}

/** Redirige a /sin-acceso si no hay sesión válida o el rol no está permitido. */
export async function requireUsuario(rolesPermitidos?: Rol[]): Promise<UsuarioActual> {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/sin-acceso");
  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) redirect("/sin-acceso");
  return usuario;
}
