import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarClock, CalendarCheck2, FileText, History, Plus, UserRound } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { nombreAlumno } from "@/lib/queries";
import { PillEstadoCaso } from "@/components/status-pills";
import { Button } from "@/components/ui/button";
import { InfoItem, SeccionCard, iniciales } from "@/components/detail-ui";
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

type CasoHistorial = {
  id: string;
  estado: string;
  fecha_apertura: string;
  incidencia_id: string | null;
  incidencias: { motivo_otro: string | null; catalogo_motivos: { nombre: string } | null } | null;
  notas_seguimiento: { contenido: string; fecha: string }[];
};

function motivoDeCaso(c: CasoHistorial) {
  if (c.incidencia_id) {
    return c.incidencias?.motivo_otro || c.incidencias?.catalogo_motivos?.nombre || "—";
  }
  const notas = [...(c.notas_seguimiento ?? [])].sort((a, b) => a.fecha.localeCompare(b.fecha));
  return notas[0]?.contenido || "—";
}

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

  const [{ data: citas }, { data: actasAlumno }, { data: psicologos }, { data: historial }] = await Promise.all([
    supabase.from("citas_padres").select("id, fecha, hora, detalle, firmas(id, firmante_tipo, firmante_nombre, fecha_hora)").eq("caso_id", caso.id),
    supabase
      .from("actas_alumno")
      .select("id, fecha, hora, detalle, declaracion_alumno, acuerdos, observaciones, firma_alumno_nombre, firma_fecha_hora")
      .eq("caso_id", caso.id)
      .order("fecha", { ascending: false }),
    usuario.rol === "jefe_psicologia"
      ? supabase.from("usuarios").select("id, nombre").eq("rol", "psicologo").eq("activo", true).neq("id", caso.psicologo_id)
      : Promise.resolve({ data: [] }),
    supabase
      .from("casos")
      .select(
        "id, estado, fecha_apertura, incidencia_id, incidencias(motivo_otro, catalogo_motivos(nombre)), notas_seguimiento(contenido, fecha)",
      )
      .eq("alumno_id", caso.alumno_id)
      .neq("id", caso.id)
      .order("fecha_apertura", { ascending: false }),
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

      <SeccionCard icon={History} titulo="Historial de casos del alumno">
        {historial && historial.length > 0 ? (
          <div className="flex flex-col divide-y divide-border">
            {(historial as unknown as CasoHistorial[]).map((h) => (
              <Link
                key={h.id}
                href={`/casos/${h.id}`}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 hover:text-primary"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <PillEstadoCaso estado={h.estado} />
                  <span className="truncate text-sm">{motivoDeCaso(h)}</span>
                </div>
                <span className="flex-none text-xs tabular-nums text-muted-foreground">
                  {new Date(h.fecha_apertura).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Este es el primer caso registrado para el alumno.</p>
        )}
      </SeccionCard>

      <div className="flex flex-wrap items-center gap-2">
        {abierto && puedeGestionar && <CerrarCasoButton casoId={caso.id} />}
        {abierto && usuario.rol === "jefe_psicologia" && (
          <DerivarDialog casoId={caso.id} psicologoActual={psicologo?.nombre ?? ""} psicologos={psicologos ?? []} />
        )}
      </div>

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
          {abierto && caso.incidencia_id && (
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
    </>
  );
}
