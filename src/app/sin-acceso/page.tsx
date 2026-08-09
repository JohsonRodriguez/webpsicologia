import Image from "next/image";
import { Clock, LogIn, ShieldX } from "lucide-react";
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
        icon={ShieldX}
        tone="critical"
        titulo="Ese correo no pertenece al colegio"
        descripcion="Solo cuentas institucionales @byron.edu.pe pueden acceder a esta plataforma. Si crees que esto es un error, contacta al administrador del sistema."
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
        icon={LogIn}
        tone="info"
        titulo="Sesión no encontrada"
        descripcion="Vuelve a iniciar sesión para continuar."
      />
    );
  }

  return (
    <Mensaje
      icon={Clock}
      tone="warn"
      titulo="Tu cuenta está pendiente de activación"
      descripcion={`Tu correo (${user.email}) ya quedó registrado. Un administrador debe asignarte un rol antes de que puedas usar la plataforma.`}
    >
      <CerrarSesionButton />
    </Mensaje>
  );
}

const toneClasses = {
  critical: "bg-critical-soft text-critical",
  info: "bg-info-soft text-info",
  warn: "bg-warn-soft text-warn",
} as const;

function Mensaje({
  icon: Icon,
  tone,
  titulo,
  descripcion,
  children,
}: {
  icon: React.ElementType;
  tone: keyof typeof toneClasses;
  titulo: string;
  descripcion: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div
        className="flex w-full max-w-sm flex-col items-center text-center"
        style={{ animation: "login-rise 400ms var(--ease-out) both" }}
        data-login-anim
      >
        <Image
          src="/insignia.png"
          alt="Colegio Lord Byron"
          width={302}
          height={312}
          className="h-auto w-16"
          priority
        />

        <span className={`mt-8 flex size-12 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          <Icon className="size-6" strokeWidth={1.8} />
        </span>

        <h1 className="mt-4 font-heading text-xl font-semibold text-balance">{titulo}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{descripcion}</p>

        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}
