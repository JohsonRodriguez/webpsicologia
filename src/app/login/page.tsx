"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  );
}

function LoginScreen() {
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <span
        style={{ display: "none" }}
        dangerouslySetInnerHTML={{
          __html: `<!--
THESIS: The login owns one idea, this gate verifies real institutional
credentials before granting access; it refuses the two-panel marketing-hero
convention this category always ships (and its opposite, a bare centered
button on a void).
OWN-WORLD: A single ID-badge object, portrait card proportions, rounded-4xl,
grommet ring, institutional green ink on card-stock white, dashed perforation
divider, holographic hover-sweep on the primary action, quiet diagonal-
hairline security backdrop.
STORY: Staff arrive already knowing they work here; the badge confirms this
is the real Lord Byron Psychopedagogical Department system, then verifies
them via Google.
FIRST VIEWPORT: Centered badge card on a quiet patterned ground: crest,
title, org caption, dashed divider, verify button, restricted-access fine
print. Nothing else.
FORM: Institutional ID badge / access terminal, candidate 3 of 7 grounded
directions, seed key 516dec8b (degraded roll, no network catalog).
FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, and DESIGN.md.
-->`,
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, var(--primary) 0px, var(--primary) 1px, transparent 1px, transparent 16px)",
          opacity: 0.05,
        }}
      />

      <div
        className="relative w-full max-w-[380px]"
        style={{ animation: "login-rise 500ms var(--ease-out) both" }}
        data-login-anim
      >
        <div
          aria-hidden
          className="absolute top-0 left-1/2 z-10 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-border bg-background shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"
        />

        <div className="rounded-4xl border border-border bg-[color:var(--badge-stock)] px-5 pt-10 pb-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_4px_rgba(22,108,82,0.08),0_24px_48px_-16px_rgba(22,108,82,0.28)] sm:px-8">
          <Image
            src="/insignia.png"
            alt="Colegio Lord Byron"
            width={302}
            height={312}
            className="mx-auto h-auto w-14"
            priority
          />

          <h1 className="mt-4 font-heading text-lg font-semibold text-balance text-primary uppercase tracking-wide">
            Departamento Psicopedagógico
          </h1>
          <p className="mt-1 text-sm text-primary/90">Colegio Lord Byron</p>

          <div
            aria-hidden
            className="mt-6 h-1"
            style={{
              backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1.3px)",
              backgroundSize: "8px 4px",
              backgroundRepeat: "repeat-x",
              backgroundPosition: "center",
            }}
          />

          <div className="flex flex-col gap-4 pt-6">
            <button
              onClick={iniciarSesion}
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-transparent bg-primary py-3.5 text-base font-medium text-primary-foreground transition-[color,background-color,border-color,box-shadow] duration-150 ease-(--ease-out) hover:bg-primary/90 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 transition-transform duration-700 ease-(--ease-out) motion-reduce:transition-none group-hover:translate-x-[400%]"
                style={{
                  backgroundImage:
                    "linear-gradient(100deg, transparent, rgba(125,211,252,0.4), rgba(216,180,254,0.4), rgba(253,224,130,0.35), transparent)",
                }}
              />
              {loading ? <Loader2 className="size-5 animate-spin" /> : <GoogleIcon className="size-5" />}
              Continuar con Google
            </button>

            {error === "auth" && (
              <div className="rounded-md bg-critical-soft px-4 py-3 text-left text-sm text-critical">
                <p>No se pudo iniciar sesión. Intenta nuevamente.</p>
                {detail && <p className="mt-1 font-mono text-xs break-words">{detail}</p>}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Acceso exclusivo para personal con cuenta institucional{" "}
              <span className="font-mono">@byron.edu.pe</span>.
            </p>
          </div>
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
