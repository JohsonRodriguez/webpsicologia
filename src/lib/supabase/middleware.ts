import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/auth", "/sin-acceso", "/bienestar-padre"];

// /auth/callback no lee ni depende de la sesión: intercambia el code de
// OAuth por una sesión nueva él mismo. El getUser() de este middleware no le
// sirve de nada ahí y es la petición más sensible a latencia del login (justo
// después de volver de Google), así que se salta por completo.
//
// /api también se salta: cada ruta bajo /api ya valida su propio acceso
// (requireUsuario() en las rutas de PDF, CRON_SECRET en el cron de correos),
// y un llamador de API (fetch, Vercel Cron, etc.) nunca debe recibir un
// redirect a la página de login — eso rompía silenciosamente el cron diario
// de la cola de correos, que caía siempre en /login sin llegar a la ruta.
const SKIP_AUTH_CHECK = ["/auth", "/api"];

function matchesAny(pathname: string, paths: string[]) {
  return paths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isPublicPath(pathname: string) {
  return matchesAny(pathname, PUBLIC_PATHS);
}

export async function updateSession(request: NextRequest) {
  if (matchesAny(request.nextUrl.pathname, SKIP_AUTH_CHECK)) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not run code between createServerClient and getUser().
  // A stray return here can randomly drop sessions (see @supabase/ssr docs).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
