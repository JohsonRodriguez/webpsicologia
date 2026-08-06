import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { NotificacionItem } from "./notificacion-item";

const HREF_POR_TIPO: Record<string, (ref: string) => string> = {
  incidencia_asignada: (ref) => `/incidencias/${ref}`,
  incidencia_derivada: (ref) => `/incidencias/${ref}`,
  incidencia_cerrada: (ref) => `/incidencias/${ref}`,
  incidencia_requiere_derivacion: (ref) => `/incidencias/${ref}`,
  caso_derivado: (ref) => `/casos/${ref}`,
};

export default async function NotificacionesPage() {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const { data } = await supabase
    .from("notificaciones")
    .select("id, tipo, referencia_id, leido, fecha, texto")
    .eq("usuario_id", usuario.id)
    .order("fecha", { ascending: false });

  const notificaciones = data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Bandeja"
        title="Notificaciones"
        description="Avisos relacionados a tus incidencias y casos."
      />
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {notificaciones.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-muted-foreground">
            No tienes notificaciones todavía.
          </p>
        ) : (
          notificaciones.map((n) => (
            <NotificacionItem
              key={n.id}
              id={n.id}
              texto={n.texto}
              fecha={n.fecha}
              leido={n.leido}
              href={n.referencia_id ? HREF_POR_TIPO[n.tipo]?.(n.referencia_id) : undefined}
            />
          ))
        )}
      </div>
    </>
  );
}
