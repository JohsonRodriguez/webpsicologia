import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const { count } = await supabase
    .from("notificaciones")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", usuario.id)
    .eq("leido", false);

  return (
    <AppShell usuario={usuario} unreadCount={count ?? 0}>
      {children}
    </AppShell>
  );
}
