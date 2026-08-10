import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMatriculasPorAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { MisActasFiltro, type FilaMiActa } from "./mis-actas-filtro";

export default async function MisActasPage() {
  const usuario = await requireUsuario(["profesor"]);
  const supabase = await createClient();

  const { data: perfil } = await supabase.from("usuarios").select("firma_guardada").eq("id", usuario.id).maybeSingle();
  const tieneFirmaGuardada = Boolean(perfil?.firma_guardada);

  const [{ data: citas }, { data: actasDocente }] = await Promise.all([
    supabase
      .from("citas_padres")
      .select(
        "id, fecha, hora, detalle, caso_id, casos(alumno_id, alumnos(nombres, apellidos)), firmas(id, firmante_tipo, firmante_nombre, fecha_hora)",
      )
      .order("fecha", { ascending: false }),
    supabase
      .from("actas_docente_padres")
      .select(
        "id, fecha, hora, detalle, alumno_id, alumnos(nombres, apellidos), firmas_acta_docente(id, firmante_tipo, firmante_nombre, fecha_hora)",
      )
      .order("fecha", { ascending: false }),
  ]);

  const alumnoIds = [
    ...(citas ?? []).map((c) => (c.casos as unknown as { alumno_id: string } | null)?.alumno_id),
    ...(actasDocente ?? []).map((a) => a.alumno_id),
  ].filter((id): id is string => Boolean(id));
  const matriculas = await getMatriculasPorAlumno(supabase, undefined, alumnoIds);

  function nivelGrado(alumnoId: string) {
    const mat = matriculas.get(alumnoId);
    return {
      nivelId: mat?.nivelId ?? "",
      nivelNombre: mat?.nivelNombre ?? "—",
      gradoId: mat?.gradoId ?? "",
      gradoNombre: mat?.gradoNombre ?? "",
      seccionId: mat?.seccionId ?? "",
      seccionNombre: mat?.seccionNombre ?? "",
    };
  }

  const filasCaso: FilaMiActa[] = (citas ?? []).map((c) => {
    const caso = c.casos as unknown as {
      alumno_id: string;
      alumnos: { nombres: string; apellidos: string } | null;
    } | null;
    const firmas = c.firmas ?? [];
    return {
      id: c.id,
      origen: "caso",
      fecha: c.fecha,
      hora: c.hora,
      detalle: c.detalle,
      alumnoNombre: caso?.alumnos ? `${caso.alumnos.nombres} ${caso.alumnos.apellidos}` : "—",
      firmas,
      pdfHref: `/api/citas/${c.id}/pdf`,
      puedeFirmar: !firmas.some((f) => f.firmante_tipo === "profesor"),
      ...nivelGrado(caso?.alumno_id ?? ""),
    };
  });

  const filasDocente: FilaMiActa[] = (actasDocente ?? []).map((a) => {
    const alumno = a.alumnos as unknown as { nombres: string; apellidos: string } | null;
    return {
      id: a.id,
      origen: "docente",
      fecha: a.fecha,
      hora: a.hora,
      detalle: a.detalle,
      alumnoNombre: alumno ? `${alumno.nombres} ${alumno.apellidos}` : "—",
      firmas: a.firmas_acta_docente ?? [],
      pdfHref: `/api/actas-docente/${a.id}/pdf`,
      puedeFirmar: false,
      ...nivelGrado(a.alumno_id),
    };
  });

  const filas = [...filasCaso, ...filasDocente].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <>
      <PageHeader
        eyebrow="Incidencias"
        title="Actas con padres"
        description="Reuniones con padres que registraste directamente, y actas de los casos originados en tus incidencias que puedes firmar."
        actions={
          <Button
            size="sm"
            render={
              <Link href="/mis-actas/nueva">
                <Plus className="size-4" />
                Registrar reunión
              </Link>
            }
          />
        }
      />
      <MisActasFiltro filas={filas} tieneFirmaGuardada={tieneFirmaGuardada} />
    </>
  );
}
