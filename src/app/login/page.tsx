"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
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
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-6" />
          </div>
          <h1 className="mt-4 font-heading text-2xl font-semibold text-balance">
            Área de Psicología
          </h1>
          <p className="text-sm text-muted-foreground">Colegio Lord Byron</p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            onClick={iniciarSesion}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <GoogleIcon className="size-4" />
            )}
            Iniciar sesión con Google
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Acceso restringido a cuentas institucionales <span className="font-mono">@byron.edu.pe</span>.
          </p>
          {error === "auth" && (
            <div className="rounded-md bg-critical-soft px-3 py-2 text-center text-sm text-critical">
              <p>No se pudo iniciar sesión. Intenta nuevamente.</p>
              {detail && <p className="mt-1 font-mono text-xs break-words">{detail}</p>}
            </div>
          )}
        </div>
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
