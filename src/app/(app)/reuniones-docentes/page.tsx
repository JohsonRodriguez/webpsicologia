import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnioActivo } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { ReunionesDocentesFiltro, type FilaReunionDocente } from "./reuniones-docentes-filtro";

export default async function ReunionesDocentesPage() {
  const usuario = await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();
  const anioActivo = await getAnioActivo(supabase);

  let matriculasQuery = supabase
    .from("matriculas")
    .select(
      "alumno_id, grado_id, seccion_id, alumnos(nombres, apellidos), grados(nombre, nivel_id, niveles(nombre)), secciones(nombre)",
    )
    .eq("anio_academico_id", anioActivo?.id ?? "");

  if (usuario.rol === "psicologo") {
    const { data: grados } = await supabase.from("psicologo_grado").select("grado_id").eq("usuario_id", usuario.id);
    const gradoIds = (grados ?? []).map((g) => g.grado_id);
    matriculasQuery = matriculasQuery.in("grado_id", gradoIds.length ? gradoIds : ["00000000-0000-0000-0000-000000000000"]);
  }

  const { data: matriculas } = await matriculasQuery;

  const alumnos = new Map<
    string,
    { nombre: string; nivelId: string; nivelNombre: string; gradoId: string; gradoNombre: string; seccionId: string; seccionNombre: string }
  >();
  for (const m of matriculas ?? []) {
    const alumno = m.alumnos as unknown as { nombres: string; apellidos: string } | null;
    const grado = m.grados as unknown as { nombre: string; nivel_id: string; niveles: { nombre: string } | null } | null;
    const seccion = m.secciones as unknown as { nombre: string } | null;
    alumnos.set(m.alumno_id, {
      nombre: alumno ? `${alumno.nombres} ${alumno.apellidos}` : "—",
      nivelId: grado?.nivel_id ?? "",
      nivelNombre: grado?.niveles?.nombre ?? "—",
      gradoId: m.grado_id,
      gradoNombre: grado?.nombre ?? "",
      seccionId: m.seccion_id,
      seccionNombre: seccion?.nombre ?? "",
    });
  }

  const alumnoIds = [...alumnos.keys()];
  const { data: actas, error: erroractas } = await supabase
    .from("actas_docente_padres")
    .select(
      "id, fecha, hora, detalle, alumno_id, usuarios!actas_docente_padres_profesor_id_fkey(nombre), firmas_acta_docente(id)",
    )
    .in("alumno_id", alumnoIds.length ? alumnoIds : ["00000000-0000-0000-0000-000000000000"])
    .order("fecha", { ascending: false });

  const filas: FilaReunionDocente[] = (actas ?? []).map((a) => {
    const info = alumnos.get(a.alumno_id);
    const docente = a.usuarios as unknown as { nombre: string } | null;
    return {
      id: a.id,
      fecha: a.fecha,
      hora: a.hora,
      detalle: a.detalle,
      alumnoNombre: info?.nombre ?? "—",
      docenteNombre: docente?.nombre ?? "—",
      firmada: (a.firmas_acta_docente?.length ?? 0) >= 1,
      pdfHref: `/api/actas-docente/${a.id}/pdf`,
      nivelId: info?.nivelId ?? "",
      nivelNombre: info?.nivelNombre ?? "—",
      gradoId: info?.gradoId ?? "",
      gradoNombre: info?.gradoNombre ?? "",
      seccionId: info?.seccionId ?? "",
      seccionNombre: info?.seccionNombre ?? "",
    };
  });

  const alumnosConActa = new Set((actas ?? []).map((a) => a.alumno_id));
  const alumnosSinActa = alumnoIds.filter((id) => !alumnosConActa.has(id)).length;

  const porDocente = new Map<string, number>();
  for (const f of filas) porDocente.set(f.docenteNombre, (porDocente.get(f.docenteNombre) ?? 0) + 1);
  const ranking = [...porDocente.entries()].sort((a, b) => b[1] - a[1]);
  const docenteConMas = ranking[0];
  const docenteConMenos = ranking[ranking.length - 1];

  return (
    <>
      <PageHeader
        eyebrow="Psicología"
        title="Reuniones de Docentes"
        description="Actas de reunión con padres que los docentes registraron directamente para tus estudiantes. Filtra por nivel, grado y sección."
      />
      {erroractas && (
        <p className="rounded-md bg-critical-soft px-3 py-2 text-sm text-critical">
          Error al cargar reuniones: {erroractas.message} (código {erroractas.code}) · {alumnoIds.length} alumnos en
          tu roster
        </p>
      )}
      <ReunionesDocentesFiltro
        filas={filas}
        totalReuniones={filas.length}
        docenteConMas={docenteConMas ? { nombre: docenteConMas[0], total: docenteConMas[1] } : null}
        docenteConMenos={docenteConMenos ? { nombre: docenteConMenos[0], total: docenteConMenos[1] } : null}
        alumnosSinActa={alumnosSinActa}
      />
    </>
  );
}
