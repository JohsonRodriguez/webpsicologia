import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UsuarioRow } from "./usuario-row";

export default async function AdminUsuariosPage() {
  await requireUsuario(["administrador"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("usuarios")
    .select("id, nombre, email, rol, activo, created_at")
    .order("created_at", { ascending: false });

  const usuarios = data ?? [];
  const pendientes = usuarios.filter((u) => !u.rol);

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Gestión de usuarios"
        description="El acceso es con Google institucional (@byron.edu.pe): cuando alguien inicia sesión por primera vez, aparece aquí pendiente de que le asignes un rol."
      />

      {pendientes.length > 0 && (
        <div className="rounded-lg bg-warn-soft px-4 py-3 text-sm text-warn">
          {pendientes.length} cuenta(s) esperando asignación de rol.
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => (
              <UsuarioRow key={u.id} usuario={u} />
            ))}
          </TableBody>
        </Table>
        {usuarios.length === 0 && (
          <p className="px-4 py-14 text-center text-sm text-muted-foreground">Todavía no hay cuentas registradas.</p>
        )}
      </div>
    </>
  );
}
