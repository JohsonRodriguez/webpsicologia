import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/types";

type DB = SupabaseClient<Database>;

export type AccionAuditoria =
  | "usuario.rol_actualizado"
  | "caso.abierto"
  | "caso.derivado"
  | "caso.cerrado"
  | "grado.eliminado"
  | "seccion.eliminada";

/**
 * Registra una acción sensible en la bitácora de auditoría (quién, qué, sobre
 * qué registro, cuándo). Nunca lanza: si falla el insert de auditoría, la
 * acción real (que ya se ejecutó) no debe verse afectada para el usuario.
 */
export async function registrarAuditoria(
  supabase: DB,
  params: {
    usuarioId: string;
    accion: AccionAuditoria;
    entidad: string;
    entidadId?: string | null;
    detalle?: Record<string, unknown>;
  },
) {
  const { error } = await supabase.from("auditoria").insert({
    usuario_id: params.usuarioId,
    accion: params.accion,
    entidad: params.entidad,
    entidad_id: params.entidadId ?? null,
    detalle: (params.detalle as Json) ?? null,
  });
  if (error) console.error("registrarAuditoria:", error);
}
