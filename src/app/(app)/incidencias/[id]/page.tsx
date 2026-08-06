import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Info, Plus } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMatriculasPorAlumno, nombreAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { PillEstadoIncidencia, PillEstadoCaso, PillPrioridad } from "@/components/status-pills";
import { Button } from "@/components/ui/button";
import { AbrirCasoButton } from "./abrir-caso-button";

export default async function IncidenciaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await requireUsuario();
  const supabase = await createClient();

  const { data: inc } = await supabase
    .from("incidencias")
    .select(
      "id, alumno_id, motivo_id, prioridad, estado, descripcion, acciones_tomadas, involucrados, fecha_hora, profesor_id, alumnos(nombres, apellidos, codigo), catalogo_motivos(nombre), usuarios!incidencias_profesor_id_fkey(nombre)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!inc) notFound();

  const alumno = inc.alumnos as unknown as { nombres: string; apellidos: string; codigo: string };
  const profesor = inc.usuarios as unknown as { nombre: string } | null;
  const motivo = inc.catalogo_motivos as unknown as { nombre: string } | null;

  const matriculas = await getMatriculasPorAlumno(supabase);
  const mat = matriculas.get(inc.alumno_id);

  const { data: caso } = await supabase
    .from("casos")
    .select("id, estado, psicologo_id, usuarios!casos_psicologo_id_fkey(nombre)")
    .eq("incidencia_id", inc.id)
    .maybeSingle();

  const puedeGestionar = usuario.rol === "psicologo" || usuario.rol === "jefe_psicologia";

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        render={
          <Link href={usuario.rol === "profesor" ? "/incidencias" : "/casos"}>
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        }
      />

      <PageHeader eyebrow="Incidencia" title={nombreAlumno(alumno)} description={motivo?.nombre} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <PillEstadoIncidencia estado={inc.estado} />
            <PillPrioridad prioridad={inc.prioridad} />
          </div>

          <dl className="grid grid-cols-[150px_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Alumno</dt>
            <dd>
              {nombreAlumno(alumno)} · <span className="font-mono">{alumno.codigo}</span>
            </dd>
            <dt className="text-muted-foreground">Grado y sección</dt>
            <dd>{mat ? `${mat.gradoNombre} "${mat.seccionNombre}"` : "—"}</dd>
            <dt className="text-muted-foreground">Reportado por</dt>
            <dd>{profesor?.nombre ?? "—"}</dd>
            <dt className="text-muted-foreground">Fecha y hora</dt>
            <dd className="tabular-nums">
              {new Date(inc.fecha_hora).toLocaleString("es-PE", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </dd>
            <dt className="text-muted-foreground">Motivo</dt>
            <dd>{motivo?.nombre ?? "—"}</dd>
          </dl>

          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Descripción
            </p>
            <p className="mt-1 text-sm">{inc.descripcion}</p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Acciones tomadas por el docente
            </p>
            <p className="mt-1 text-sm">{inc.acciones_tomadas}</p>
          </div>
          {inc.involucrados && (
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Personas involucradas
              </p>
              <p className="mt-1 text-sm">{inc.involucrados}</p>
            </div>
          )}

          {usuario.rol === "profesor" && (
            <div className="flex items-start gap-2.5 rounded-lg bg-info-soft px-3.5 py-2.5 text-sm text-info">
              <Info className="mt-0.5 size-4 flex-none" />
              <span>Esta incidencia quedó fija al enviarse: no puedes editarla ni comentarla.</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="font-heading text-base font-semibold">Caso asociado</h3>
          {caso ? (
            <>
              <p className="text-sm text-muted-foreground">
                Esta incidencia originó un caso de seguimiento.
              </p>
              <div className="flex items-center gap-2">
                <PillEstadoCaso estado={caso.estado} />
                <span className="text-sm text-muted-foreground">
                  a cargo de {(caso.usuarios as unknown as { nombre: string } | null)?.nombre}
                </span>
              </div>
              {puedeGestionar && (
                <Button
                  render={
                    <Link href={`/casos/${caso.id}`}>
                      Ver caso
                      <ArrowRight className="size-4" />
                    </Link>
                  }
                />
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Aún no se ha abierto un caso de seguimiento para esta incidencia.
              </p>
              {puedeGestionar && (
                <AbrirCasoButton incidenciaId={inc.id}>
                  <Plus className="size-4" />
                  Abrir caso de seguimiento
                </AbrirCasoButton>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
