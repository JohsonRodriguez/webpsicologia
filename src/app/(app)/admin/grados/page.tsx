import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import {
  crearGrado,
  renombrarGrado,
  eliminarGrado,
  crearSeccion,
  renombrarSeccion,
  eliminarSeccion,
} from "../actions";
import { EditableName } from "./editable-name";
import { EliminarButton } from "./eliminar-button";
import { AgregarInline } from "./agregar-form";

export default async function AdminGradosPage() {
  await requireUsuario(["administrador"]);
  const supabase = await createClient();

  const { data: niveles } = await supabase.from("niveles").select("id, nombre, orden").order("orden");
  const { data: grados } = await supabase.from("grados").select("id, nivel_id, nombre, orden").order("orden");
  const { data: secciones } = await supabase.from("secciones").select("id, grado_id, nombre").order("nombre");
  const { data: asignaciones } = await supabase.from("psicologo_grado").select("grado_id, usuarios(nombre)");
  const { data: matriculas } = await supabase.from("matriculas").select("grado_id, seccion_id");

  const asignacionPorGrado = new Map(
    (asignaciones ?? []).map((a) => [a.grado_id, (a.usuarios as unknown as { nombre: string } | null)?.nombre]),
  );

  const alumnosPorGrado = new Map<string, number>();
  const alumnosPorSeccion = new Map<string, number>();
  for (const m of matriculas ?? []) {
    alumnosPorGrado.set(m.grado_id, (alumnosPorGrado.get(m.grado_id) ?? 0) + 1);
    if (m.seccion_id) alumnosPorSeccion.set(m.seccion_id, (alumnosPorSeccion.get(m.seccion_id) ?? 0) + 1);
  }

  return (
    <>
      <PageHeader
        eyebrow="Administración"
        title="Grados y secciones"
        description="Estructura académica del colegio, por nivel. Pasa el cursor sobre un nombre para editarlo."
      />
      <div className="flex flex-col gap-5">
        {(niveles ?? []).map((nivel) => {
          const gradosNivel = (grados ?? []).filter((g) => g.nivel_id === nivel.id);
          return (
            <div key={nivel.id} className="rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="font-heading text-base font-semibold">{nivel.nombre}</h3>
                <AgregarInline
                  variant="row"
                  placeholder="Nombre del grado"
                  triggerLabel="Agregar grado"
                  onCreate={crearGrado.bind(null, nivel.id)}
                />
              </div>
              <div className="flex flex-col divide-y divide-border">
                {gradosNivel.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No hay grados registrados en este nivel.
                  </div>
                )}
                {gradosNivel.map((g) => {
                  const seccionesGrado = (secciones ?? []).filter((s) => s.grado_id === g.id);
                  const totalAlumnos = alumnosPorGrado.get(g.id) ?? 0;
                  return (
                    <div key={g.id} className="flex flex-col gap-2.5 px-4 py-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <EditableName
                            value={g.nombre}
                            onSave={renombrarGrado.bind(null, g.id)}
                            textClassName="font-semibold"
                          />
                          <EliminarButton
                            onDelete={eliminarGrado.bind(null, g.id)}
                            confirmMessage={`¿Eliminar el grado "${g.nombre}"? Esta acción no se puede deshacer.`}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {totalAlumnos} alumno(s) · Psicólogo: {asignacionPorGrado.get(g.id) ?? "—"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {seccionesGrado.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs"
                          >
                            <EditableName value={s.nombre} onSave={renombrarSeccion.bind(null, s.id)} />
                            <span className="text-muted-foreground">({alumnosPorSeccion.get(s.id) ?? 0})</span>
                            <EliminarButton
                              onDelete={eliminarSeccion.bind(null, s.id)}
                              confirmMessage={`¿Eliminar la sección "${s.nombre}"?`}
                            />
                          </div>
                        ))}
                        <AgregarInline
                          variant="chip"
                          placeholder="Sección"
                          triggerLabel="Sección"
                          onCreate={crearSeccion.bind(null, g.id)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
