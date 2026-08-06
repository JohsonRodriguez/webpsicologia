import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
