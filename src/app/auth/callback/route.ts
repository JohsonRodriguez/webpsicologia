import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rutaInicioPara, type Rol } from "@/lib/roles";

const ALLOWED_DOMAIN = (process.env.ALLOWED_EMAIL_DOMAIN ?? "byron.edu.pe").toLowerCase();

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  try {
    if (code) {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data.user) {
        const email = data.user.email?.toLowerCase() ?? "";
        if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/sin-acceso?motivo=dominio`);
        }

        // Si no había una página específica pendiente (caso normal: login
        // desde /login sin "next"), resolvemos el destino por rol aquí mismo
        // en vez de rebotar por "/" — esa página solo existía para hacer
        // exactamente esta consulta y redirigir de nuevo, un salto completo
        // de ida y vuelta al navegador que esta ruta ya puede evitarse.
        //
        // Importante: se reutiliza el mismo cliente `supabase` de arriba (ya
        // trae la sesión recién creada por exchangeCodeForSession en
        // memoria) en vez de crear uno nuevo con getUsuarioActual(), que
        // internamente arma OTRO cliente y hace su propio getUser() de red
        // dependiendo de releer las cookies que este mismo request recién
        // escribió. Esa relectura es frágil en un Route Handler: si fallaba,
        // el destino siempre caía a "/" de todos modos, pero pagando el
        // costo extra de esa llamada desperdiciada — quedaba más lento que
        // antes de este atajo, no más rápido.
        if (next === "/") {
          const { data: perfil } = await supabase
            .from("usuarios")
            .select("rol, activo")
            .eq("id", data.user.id)
            .maybeSingle();
          const destino = perfil?.activo && perfil.rol ? rutaInicioPara(perfil.rol as Rol) : "/";
          return NextResponse.redirect(`${origin}${destino}`);
        }

        return NextResponse.redirect(`${origin}${next}`);
      }

      console.error("exchangeCodeForSession error", error);
      const detail = encodeURIComponent(error?.message ?? "sin sesión tras exchangeCodeForSession");
      return NextResponse.redirect(`${origin}/login?error=auth&detail=${detail}`);
    }
  } catch (err) {
    console.error("auth callback crashed", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(`${origin}/login?error=auth&detail=${encodeURIComponent(message)}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
