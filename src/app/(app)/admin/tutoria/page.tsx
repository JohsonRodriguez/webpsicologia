import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnios, getAnioActivo } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { AnioSelector } from "../../alumnos/[id]/anio-selector";
import { TutorSelect } from "./tutor-select";

export default async function AdminTutoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string }>;
}) {
  const { anio: anioParam } = await searchParams;
  await requireUsuario(["administrador"]);
  const supabase = await createClient();

  const anios = await getAnios(supabase);
  const activo = await getAnioActivo(supabase);
  const anioSeleccionado = anios.find((a) => a.id === anioParam) ?? activo ?? anios[0];
  const anioId = anioSeleccionado?.id ?? "";

  const [{ data: niveles }, { data: grados }, { data: secciones }, { data: asignaciones }, { data: profesores }] =
    await Promise.all([
      supabase.from("niveles").select("id, nombre, orden").order("orden"),
      supabase.from("grados").select("id, nivel_id, nombre, orden").order("orden"),
      supabase.from("secciones").select("id, grado_id, nombre").order("nombre"),
      supabase.from("tutoria_aula").select("id, seccion_id, usuario_id, slot").eq("anio_academico_id", anioId).is("fecha_fin", null),
      supabase.from("usuarios").select("id, nombre").eq("rol", "profesor").eq("activo", true).order("nombre"),
    ]);

  const asignacionPorSeccion = new Map<string, { slot1?: string; slot2?: string }>();
  for (const a of asignaciones ?? []) {
    const actual = asignacionPorSeccion.get(a.seccion_id) ?? {};
    if (a.slot === 1) actual.slot1 = a.usuario_id;
    if (a.slot === 2) actual.slot2 = a.usuario_id;
    asignacionPorSeccion.set(a.seccion_id, actual);
  }

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Tutoría"
        description="Asigna hasta 2 docentes tutores por aula. La asignación es por año lectivo y queda registrada con fecha de inicio."
        actions={<AnioSelector anios={anios} seleccionado={anioId} />}
      />

      <div className="flex flex-col gap-5">
        {(niveles ?? []).map((nivel) => {
          const gradosNivel = (grados ?? []).filter((g) => g.nivel_id === nivel.id);
          if (gradosNivel.length === 0) return null;
          return (
            <div key={nivel.id} className="rounded-xl border border-border bg-card shadow-sm">
              <div className="border-b border-border p-4">
                <h3 className="font-heading text-base font-semibold">{nivel.nombre}</h3>
              </div>
              <div className="flex flex-col divide-y divide-border">
                {gradosNivel.map((g) => {
                  const seccionesGrado = (secciones ?? []).filter((s) => s.grado_id === g.id);
                  return seccionesGrado.map((s) => {
                    const actual = asignacionPorSeccion.get(s.id) ?? {};
                    return (
                      <div key={s.id} className="grid grid-cols-1 items-center gap-2.5 px-4 py-3.5 sm:grid-cols-3">
                        <span className="text-sm font-semibold">
                          {g.nombre} &quot;{s.nombre}&quot;
                        </span>
                        <TutorSelect
                          seccionId={s.id}
                          anioId={anioId}
                          slot={1}
                          actual={actual.slot1 ?? ""}
                          profesores={profesores ?? []}
                        />
                        <TutorSelect
                          seccionId={s.id}
                          anioId={anioId}
                          slot={2}
                          actual={actual.slot2 ?? ""}
                          profesores={profesores ?? []}
                        />
                      </div>
                    );
                  });
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
