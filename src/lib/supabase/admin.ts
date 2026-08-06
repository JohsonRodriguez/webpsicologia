import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Bypasses RLS entirely. Only import this from server-side admin API routes
// (src/app/api/admin/**) after verifying the caller's role is administrador.
// Never import from a Client Component or expose SUPABASE_SECRET_KEY to the browser.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
