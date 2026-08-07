import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { FirmaForm } from "./firma-form";

export default async function MiFirmaPage() {
  const usuario = await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();

  const { data } = await supabase.from("usuarios").select("firma_guardada").eq("id", usuario.id).maybeSingle();

  return (
    <>
      <PageHeader
        eyebrow="Mi cuenta"
        title="Mi firma"
        description="Guarda tu firma una sola vez para usarla automáticamente en las actas de reunión con padres. Si no guardas una firma, tu nombre aparecerá igual en el PDF, sin imagen de firma."
      />
      <FirmaForm firmaGuardada={data?.firma_guardada ?? null} />
    </>
  );
}
