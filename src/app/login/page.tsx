"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2, Lock, ShieldCheck, HeartHandshake, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  );
}

function LoginScreen() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_1.08fr]">
      <HeroPanel />
      <FormPanel />
    </div>
  );
}

function HeroPanel() {
  return (
    <section
      className="relative hidden flex-col justify-between overflow-hidden px-16 py-16 text-[color:var(--login-hero-foreground)] lg:flex"
      style={{ background: "radial-gradient(circle at 70% 45%, var(--login-hero-from), var(--login-hero-to) 65%)" }}
    >
      <Image
        src="/logo.png"
        alt="Colegio Lord Byron"
        width={258}
        height={150}
        className="h-auto w-[180px] flex-none self-center"
        style={{ animation: "login-rise 500ms var(--ease-out) both" }}
        data-login-anim
        priority
      />

      <div className="my-auto max-w-[500px]">
        <h1
          className="font-heading text-[46px] leading-[1.1] font-semibold text-balance"
          style={{ animation: "login-rise 500ms var(--ease-out) both", animationDelay: "80ms" }}
          data-login-anim
        >
          Departamento
          <br />
          Psicopedagógico
        </h1>
        <p
          className="mt-4 text-[22px] text-[color:var(--login-hero-foreground)]"
          style={{ animation: "login-rise 500ms var(--ease-out) both", animationDelay: "160ms" }}
          data-login-anim
        >
          Un espacio seguro para acompañar, orientar y fortalecer a nuestra comunidad educativa.
        </p>
        <ul className="mt-5 flex list-none flex-col gap-4.5 p-0">
          <Feature icon={Lock} delay={240}>
            Información protegida
          </Feature>
          <Feature icon={Users} delay={300}>
            Acceso según tu función
          </Feature>
          <Feature icon={HeartHandshake} delay={360}>
            Acompañamiento conectado
          </Feature>
        </ul>
        <blockquote
          className="mt-7.5 w-full border-t pt-7 text-[22px] font-medium text-balance italic"
          style={{
            borderColor: "var(--login-hero-quote-border)",
            animation: "login-rise 500ms var(--ease-out) both",
            animationDelay: "440ms",
          }}
          data-login-anim
        >
          &ldquo;El bienestar también forma parte del aprendizaje.&rdquo;
        </blockquote>
      </div>

      <small className="text-xs text-[color:var(--login-hero-foreground)]/75">
        Lord Byron School · Área de Psicología
      </small>
    </section>
  );
}

function Feature({
  icon: Icon,
  delay,
  children,
}: {
  icon: React.ElementType;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <li
      className="flex items-center gap-4 text-lg"
      style={{ animation: "login-rise 500ms var(--ease-out) both", animationDelay: `${delay}ms` }}
      data-login-anim
    >
      <span className="flex size-9 flex-none items-center justify-center rounded-full bg-white/12">
        <Icon className="size-4.5" strokeWidth={1.8} />
      </span>
      {children}
    </li>
  );
}

function FormPanel() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const error = searchParams.get("error");
  const detail = searchParams.get("detail");

  async function iniciarSesion() {
    setLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { hd: "byron.edu.pe", prompt: "select_account" },
      },
    });
    if (error) setLoading(false);
  }

  return (
    <section className="flex flex-col bg-[color:var(--login-panel-bg)] px-8 py-10 sm:px-[12%]">
      <div
        className="mx-auto flex w-full max-w-[520px] flex-1 flex-col justify-center gap-8 py-10"
        style={{ animation: "login-rise 400ms var(--ease-out) both" }}
        data-login-anim
      >
        <div>
          <p className="text-lg font-semibold text-primary">Bienvenido</p>
          <h2 className="font-heading mt-1 text-[38px] leading-tight font-semibold">Ingresa a tu cuenta</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Psicólogos, docentes, jefatura y administración ingresan con su cuenta institucional de Google.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={iniciarSesion}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3.5 rounded-lg border border-muted-foreground/40 bg-white py-4 text-lg font-medium text-foreground transition-colors duration-150 ease-(--ease-out) hover:bg-[color:var(--login-panel-hover)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-5 animate-spin" /> : <GoogleIcon className="size-5" />}
            Continuar con Google
          </button>

          {error === "auth" && (
            <div className="rounded-md bg-critical-soft px-4 py-3 text-sm text-critical">
              <p>No se pudo iniciar sesión. Intenta nuevamente.</p>
              {detail && <p className="mt-1 font-mono text-xs break-words">{detail}</p>}
            </div>
          )}

          <div className="mt-2 flex items-start gap-3 rounded-lg border border-primary/20 bg-accent p-4">
            <ShieldCheck className="mt-0.5 size-5 flex-none text-primary" strokeWidth={1.8} />
            <div>
              <p className="font-semibold text-foreground">Acceso seguro y confidencial</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Solo cuentas <span className="font-mono">@byron.edu.pe</span> con un rol asignado por el
                administrador pueden ingresar.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 border-t border-border pt-6 sm:flex sm:items-center sm:justify-between sm:gap-0">
          <BottomFeature icon={ShieldCheck} title="Seguridad" subtitle="Tus datos protegidos" />
          <BottomFeature icon={HeartHandshake} title="Acompañamiento" subtitle="al estudiante" />
          <BottomFeature icon={Users} title="Trazabilidad" subtitle="Acceso por rol" />
        </div>
      </div>
    </section>
  );
}

function BottomFeature({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className="flex size-9 flex-none items-center justify-center rounded-full"
        style={{ background: "var(--login-hero-to)", color: "var(--login-hero-foreground)" }}
      >
        <Icon className="size-4" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11C3.24 21.3 7.28 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.26A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.26 5.39l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.26 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}
