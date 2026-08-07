import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  CalendarCheck2,
  FileText,
  MessagesSquare,
  Plus,
  Sparkles,
  UserRound,
} from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { nombreAlumno } from "@/lib/queries";
import { PillEstadoCaso } from "@/components/status-pills";
import { Button } from "@/components/ui/button";
import { InfoItem, SeccionCard, iniciales } from "@/components/detail-ui";
import { NotaForm } from "./nota-form";
import { CerrarCasoButton } from "./cerrar-caso-button";
import { DerivarDialog } from "./derivar-dialog";
import { ActaResumen } from "./acta-resumen";
import { ActaAlumnoResumen } from "./acta-alumno-resumen";

const ESTADO_BORDE: Record<string, string> = {
  abierto: "border-l-info",
  en_atencion: "border-l-warn",
  derivado: "border-l-purple",
  cerrado: "border-l-good",
};

export default async function CasoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();

  const { data: caso } = await supabase
    .from("casos")
    .select(
      "id, alumno_id, incidencia_id, tipo, estado, fecha_apertura, fecha_cierre, psicologo_id, psicologo_original_id, alumnos(nombres, apellidos, codigo), psicologo:usuarios!casos_psicologo_id_fkey(nombre), original:usuarios!casos_psicologo_original_id_fkey(nombre)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!caso) notFound();

  const alumno = caso.alumnos as unknown as { nombres: string; apellidos: string; codigo: string };
  const psicologo = caso.psicologo as unknown as { nombre: string } | null;
  const original = caso.original as unknown as { nombre: string } | null;
  const derivado = caso.psicologo_original_id && caso.psicologo_original_id !== caso.psicologo_id;
  const puedeGestionar = usuario.rol === "jefe_psicologia" || caso.psicologo_id === usuario.id;
  const abierto = caso.estado !== "cerrado";

  const [{ data: notas }, { data: citas }, { data: actasAlumno }, { data: psicologos }] = await Promise.all([
    supabase
      .from("notas_seguimiento")
      .select("id, fecha, contenido, usuarios(nombre)")
      .eq("caso_id", caso.id)
      .order("fecha", { ascending: true }),
    supabase.from("citas_padres").select("id, fecha, hora, detalle, firmas(id, firmante_tipo, firmante_nombre, fecha_hora)").eq("caso_id", caso.id),
    supabase
      .from("actas_alumno")
      .select("id, fecha, hora, detalle, declaracion_alumno, acuerdos, firma_alumno_nombre, firma_fecha_hora")
      .eq("caso_id", caso.id)
      .order("fecha", { ascending: false }),
    usuario.rol === "jefe_psicologia"
      ? supabase.from("usuarios").select("id, nombre").eq("rol", "psicologo").eq("activo", true).neq("id", caso.psicologo_id)
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        render={
          <Link href="/casos">
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        }
      />

      <div
        className={`flex flex-col gap-4 rounded-2xl border border-l-4 border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between ${
          ESTADO_BORDE[caso.estado] ?? "border-l-border"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="flex size-14 flex-none items-center justify-center rounded-full bg-primary/10 font-heading text-lg font-bold text-primary">
            {iniciales(alumno.nombres, alumno.apellidos)}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Caso</p>
            <h1 className="font-heading text-xl font-bold text-foreground">{nombreAlumno(alumno)}</h1>
            <p className="text-sm text-muted-foreground">
              {caso.tipo === "caso_1"
                ? "Originado desde una incidencia reportada por un docente."
                : "Caso abierto directamente por el psicólogo."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PillEstadoCaso estado={caso.estado} />
          {derivado && (
            <span className="inline-flex items-center rounded-full bg-purple px-2.5 py-1 text-xs font-bold text-white">
              Derivado
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {abierto && puedeGestionar && <CerrarCasoButton casoId={caso.id} />}
        {abierto && usuario.rol === "jefe_psicologia" && (
          <DerivarDialog casoId={caso.id} psicologoActual={psicologo?.nombre ?? ""} psicologos={psicologos ?? []} />
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3.5 rounded-xl border border-border bg-card p-4.5 shadow-sm">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <InfoItem icon={UserRound} label="Código de alumno">
                <span className="font-mono">{alumno.codigo}</span>
              </InfoItem>
              <InfoItem icon={UserRound} label="Psicólogo actual">
                {psicologo?.nombre ?? "—"}
              </InfoItem>
              {derivado && (
                <InfoItem icon={UserRound} label="Psicólogo original">
                  {original?.nombre ?? "—"}
                </InfoItem>
              )}
              <InfoItem icon={CalendarClock} label="Apertura">
                {new Date(caso.fecha_apertura).toLocaleDateString("es-PE", { dateStyle: "long" })}
              </InfoItem>
              {caso.fecha_cierre && (
                <InfoItem icon={CalendarCheck2} label="Cierre">
                  {new Date(caso.fecha_cierre).toLocaleDateString("es-PE", { dateStyle: "long" })}
                </InfoItem>
              )}
            </div>
            {caso.incidencia_id && (
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                render={
                  <Link href={`/incidencias/${caso.incidencia_id}`}>
                    <ArrowUpRight className="size-4" />
                    Ver incidencia de origen
                  </Link>
                }
              />
            )}
          </div>

          <SeccionCard
            icon={FileText}
            titulo="Actas de reunión con padres"
            accion={
              abierto &&
              puedeGestionar && (
                <Button
                  size="sm"
                  render={
                    <Link href={`/casos/${caso.id}/acta-nueva`}>
                      <Plus className="size-4" />
                      Registrar acta
                    </Link>
                  }
                />
              )
            }
          >
            <div className="flex flex-col gap-3">
              {citas && citas.length > 0 ? (
                citas.map((c) => <ActaResumen key={c.id} cita={c} />)
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sin actas registradas. Las citas se agendan en SIANET; aquí se documenta el acta de la reunión.
                </p>
              )}
            </div>
          </SeccionCard>

          <SeccionCard
            icon={FileText}
            titulo="Actas de sesión con el alumno"
            accion={
              abierto &&
              puedeGestionar && (
                <Button
                  size="sm"
                  render={
                    <Link href={`/casos/${caso.id}/acta-alumno-nueva`}>
                      <Plus className="size-4" />
                      Registrar acta
                    </Link>
                  }
                />
              )
            }
          >
            <div className="flex flex-col gap-3">
              {actasAlumno && actasAlumno.length > 0 ? (
                actasAlumno.map((a) => (
                  <ActaAlumnoResumen key={a.id} acta={a} alumnoNombre={nombreAlumno(alumno)} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sin actas de sesión individual registradas. A diferencia del acta con padres, aquí solo firma el
                  alumno.
                </p>
              )}
            </div>
          </SeccionCard>
        </div>

        <SeccionCard icon={MessagesSquare} titulo="Notas de seguimiento">
          <div className="flex flex-col">
            {(notas ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin notas todavía.</p>
            ) : (
              (notas ?? []).map((n, i, arr) => (
                <div key={n.id} className="grid grid-cols-[24px_1fr] gap-x-3">
                  <div className="flex flex-col items-center">
                    <Sparkles className="mt-1 size-3 text-primary" />
                    {i < arr.length - 1 && <div className="my-1 w-px flex-1 bg-border" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-xs text-muted-foreground">
                      {(n.usuarios as unknown as { nombre: string } | null)?.nombre} ·{" "}
                      {new Date(n.fecha).toLocaleString("es-PE", { dateStyle: "long", timeStyle: "short" })}
                    </p>
                    <div className="mt-1 rounded-lg bg-secondary px-3 py-2 text-sm">{n.contenido}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          {abierto && puedeGestionar && <NotaForm casoId={caso.id} />}
        </SeccionCard>
      </div>
    </>
  );
}
