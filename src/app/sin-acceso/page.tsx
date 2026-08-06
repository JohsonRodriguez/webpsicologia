import { AlertTriangle, Clock, ShieldX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CerrarSesionButton } from "@/components/cerrar-sesion-button";

export default async function SinAccesoPage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string }>;
}) {
  const { motivo } = await searchParams;

  if (motivo === "dominio") {
    return (
      <Mensaje
        icon={<ShieldX className="size-6" />}
        titulo="Ese correo no pertenece al colegio"
        descripcion="Solo cuentas institucionales @byron.edu.pe pueden acceder a esta plataforma. Si crees que esto es un error, contacta al administrador del sistema."
        mostrarLogout={false}
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Mensaje
        icon={<AlertTriangle className="size-6" />}
        titulo="Sesión no encontrada"
        descripcion="Vuelve a iniciar sesión para continuar."
        mostrarLogout={false}
      />
    );
  }

  return (
    <Mensaje
      icon={<Clock className="size-6" />}
      titulo="Tu cuenta está pendiente de activación"
      descripcion={`Tu correo (${user.email}) ya quedó registrado. Un administrador debe asignarte un rol antes de que puedas usar la plataforma.`}
      mostrarLogout
    />
  );
}

function Mensaje({
  icon,
  titulo,
  descripcion,
  mostrarLogout,
}: {
  icon: React.ReactNode;
  titulo: string;
  descripcion: string;
  mostrarLogout: boolean;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-warn-soft text-warn">
          {icon}
        </div>
        <h1 className="mt-4 font-heading text-xl font-semibold text-balance">{titulo}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{descripcion}</p>
        {mostrarLogout && (
          <div className="mt-6">
            <CerrarSesionButton />
          </div>
        )}
      </div>
    </div>
  );
}
