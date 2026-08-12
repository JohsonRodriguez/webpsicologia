"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SimpleSelect } from "@/components/simple-select";
import { rolLabel, type Rol } from "@/lib/roles";
import { actualizarUsuario } from "../actions";

const ROLES: Rol[] = ["profesor", "psicologo", "jefe_psicologia", "administrador", "coordinador_bienestar"];

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: string | null;
  activo: boolean;
};

export function UsuarioRow({ usuario }: { usuario: Usuario }) {
  const [pending, startTransition] = useTransition();

  function cambiarRol(rol: string) {
    startTransition(async () => {
      const result = await actualizarUsuario(usuario.id, {
        rol: (rol || null) as Rol | null,
        activo: rol ? true : usuario.activo,
      });
      if (result?.error) toast.error(result.error);
      else toast.success("Usuario actualizado");
    });
  }

  function alternarActivo() {
    startTransition(async () => {
      const result = await actualizarUsuario(usuario.id, { activo: !usuario.activo });
      if (result?.error) toast.error(result.error);
      else toast.success(usuario.activo ? "Usuario desactivado" : "Usuario activado");
    });
  }

  return (
    <TableRow>
      <TableCell>
        <div className="font-semibold">{usuario.nombre}</div>
        <div className="text-xs text-muted-foreground">{usuario.email}</div>
      </TableCell>
      <TableCell>
        <SimpleSelect
          defaultValue={usuario.rol ?? ""}
          disabled={pending}
          onValueChange={cambiarRol}
          placeholder="Sin asignar"
          options={[{ value: "", label: "Sin asignar" }, ...ROLES.map((r) => ({ value: r, label: rolLabel(r) }))]}
        />
      </TableCell>
      <TableCell>
        {!usuario.rol ? (
          <span className="inline-flex items-center rounded-full bg-warn px-2.5 py-1 text-xs font-bold text-white">
            Pendiente
          </span>
        ) : usuario.activo ? (
          <span className="inline-flex items-center rounded-full bg-good px-2.5 py-1 text-xs font-bold text-white">
            Activo
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground">
            Inactivo
          </span>
        )}
      </TableCell>
      <TableCell>
        {usuario.rol && (
          <Button variant="outline" size="sm" disabled={pending} onClick={alternarActivo}>
            {pending && <Loader2 className="size-3.5 animate-spin" />}
            {usuario.activo ? "Desactivar" : "Activar"}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
