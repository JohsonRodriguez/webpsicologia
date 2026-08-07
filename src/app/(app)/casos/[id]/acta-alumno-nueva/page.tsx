import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { nombreAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ActaAlumnoForm } from "./acta-alumno-form";

export default async function ActaAlumnoNuevaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();

  const { data: caso } = await supabase
    .from("casos")
    .select("id, alumnos(nombres, apellidos)")
    .eq("id", id)
    .maybeSingle();

  if (!caso) notFound();
  const alumno = caso.alumnos as unknown as { nombres: string; apellidos: string };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        render={
          <Link href={`/casos/${id}`}>
            <ArrowLeft className="size-4" />
            Volver al caso
          </Link>
        }
      />
      <PageHeader
        eyebrow="Sesión individual"
        title="Registrar acta con el alumno"
        description="A diferencia del acta de reunión con padres, aquí solo firma el alumno."
      />
      <ActaAlumnoForm casoId={id} alumnoNombre={nombreAlumno(alumno)} psicologoNombre={usuario.nombre} />
    </>
  );
}
