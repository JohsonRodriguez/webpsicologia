import "server-only";
import { cache } from "react";
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

/**
 * Usuario autenticado con rol asignado y cuenta activa, o null.
 * Envuelto en cache() de React: el layout y cada page llaman a esto por
 * separado, y sin memoización cada llamada repetía el round-trip a
 * Supabase Auth (getUser) más la consulta a `usuarios` dentro del mismo
 * request.
 */
export const getUsuarioActual = cache(async (): Promise<UsuarioActual | null> => {
  // TEMPORAL: instrumentación de tiempos para diagnosticar la demora del
  // login. Quitar una vez que tengamos números claros de dónde se va el tiempo.
  const t0 = Date.now();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log(`[perf][getUsuarioActual] getUser(): ${Date.now() - t0}ms`);
  if (!user) return null;

  const { data } = await supabase
    .from("usuarios")
    .select("id, nombre, email, rol, activo")
    .eq("id", user.id)
    .maybeSingle();
  console.log(`[perf][getUsuarioActual] total (getUser + consulta usuarios): ${Date.now() - t0}ms`);

  if (!data || !data.activo || !data.rol) return null;

  return { id: data.id, nombre: data.nombre, email: data.email, rol: data.rol as Rol };
});

/** Redirige a /sin-acceso si no hay sesión válida o el rol no está permitido. */
export async function requireUsuario(rolesPermitidos?: Rol[]): Promise<UsuarioActual> {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/sin-acceso");
  if (rolesPermitidos && !rolesPermitidos.includes(usuario.rol)) redirect("/sin-acceso");
  return usuario;
}
