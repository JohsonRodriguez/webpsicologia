import { createAdminClient } from "@/lib/supabase/admin";
import { nombreAlumno } from "@/lib/queries";
import { PadreObservacionForm } from "./padre-observacion-form";

export default async function BienestarPadrePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Sin sesión: esta página la abre el padre de familia desde un enlace
  // enviado por el coordinador. El token es la única autorización.
  const admin = createAdminClient();
  const { data: reunion } = await admin
    .from("reuniones_bienestar")
    .select("id, periodo, alumnos(nombres, apellidos)")
    .eq("token", token)
    .is("observacion_padre", null)
    .maybeSingle();

  const alumno = reunion?.alumnos as unknown as { nombres: string; apellidos: string } | null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-4xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="text-center font-heading text-lg font-semibold text-primary uppercase tracking-wide">
          Bienestar Familiar
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Colegio Lord Byron</p>

        {!reunion || !alumno ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Este enlace ya no está disponible. Si crees que se trata de un error, contacta al coordinador de
            bienestar familiar.
          </p>
        ) : (
          <>
            <p className="mt-6 text-center text-sm">
              Reunión de bienestar familiar de <strong>{nombreAlumno(alumno)}</strong> · {reunion.periodo}
            </p>
            <div className="mt-6">
              <PadreObservacionForm token={token} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
