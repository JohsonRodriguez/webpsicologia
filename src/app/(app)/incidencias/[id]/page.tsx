import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Info,
  Plus,
  GraduationCap,
  UserRound,
  CalendarClock,
  MessageSquareText,
  ShieldCheck,
  Users,
  FolderOpen,
} from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getMatriculasPorAlumno, nombreAlumno } from "@/lib/queries";
import { PillEstadoIncidencia, PillEstadoCaso, PillPrioridad } from "@/components/status-pills";
import { Button } from "@/components/ui/button";
import { AbrirCasoButton } from "./abrir-caso-button";

const PRIORIDAD_BORDE: Record<string, string> = {
  baja: "border-l-good",
  media: "border-l-warn",
  alta: "border-l-critical",
};

function iniciales(nombres: string, apellidos: string) {
  return `${nombres[0] ?? ""}${apellidos[0] ?? ""}`.toUpperCase();
}

function InfoItem({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex size-8 flex-none items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="truncate text-sm font-semibold">{children}</span>
      </div>
    </div>
  );
}

function BloqueTexto({
  icon: Icon,
  titulo,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4.5 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-primary">
        <Icon className="size-4" />
        <h3 className="text-sm font-bold">{titulo}</h3>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">{children}</p>
    </div>
  );
}

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

      <div
        className={`flex flex-col gap-4 rounded-2xl border border-l-4 border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between ${
          PRIORIDAD_BORDE[inc.prioridad] ?? "border-l-border"
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="flex size-14 flex-none items-center justify-center rounded-full bg-primary/10 font-heading text-lg font-bold text-primary">
            {iniciales(alumno.nombres, alumno.apellidos)}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Incidencia</p>
            <h1 className="font-heading text-xl font-bold text-foreground">{nombreAlumno(alumno)}</h1>
            <p className="text-sm text-muted-foreground">{motivo?.nombre ?? "—"}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PillEstadoIncidencia estado={inc.estado} />
          <PillPrioridad prioridad={inc.prioridad} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3.5 rounded-xl border border-border bg-card p-4.5 shadow-sm sm:grid-cols-2">
            <InfoItem icon={GraduationCap} label="Grado y sección">
              {mat ? `${mat.gradoNombre} "${mat.seccionNombre}"` : "—"}
            </InfoItem>
            <InfoItem icon={UserRound} label="Reportado por">
              {profesor?.nombre ?? "—"}
            </InfoItem>
            <InfoItem icon={CalendarClock} label="Fecha y hora">
              {new Date(inc.fecha_hora).toLocaleString("es-PE", { dateStyle: "long", timeStyle: "short" })}
            </InfoItem>
            <InfoItem icon={UserRound} label="Código de alumno">
              <span className="font-mono">{alumno.codigo}</span>
            </InfoItem>
          </div>

          <BloqueTexto icon={MessageSquareText} titulo="Descripción">
            {inc.descripcion}
          </BloqueTexto>

          <BloqueTexto icon={ShieldCheck} titulo="Acciones tomadas por el docente">
            {inc.acciones_tomadas}
          </BloqueTexto>

          {inc.involucrados && (
            <BloqueTexto icon={Users} titulo="Personas involucradas">
              {inc.involucrados}
            </BloqueTexto>
          )}

          {usuario.rol === "profesor" && (
            <div className="flex items-start gap-2.5 rounded-lg bg-info-soft px-3.5 py-2.5 text-sm text-info">
              <Info className="mt-0.5 size-4 flex-none" />
              <span>Esta incidencia quedó fija al enviarse: no puedes editarla ni comentarla.</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <FolderOpen className="size-4" />
            <h3 className="font-heading text-base font-semibold">Caso asociado</h3>
          </div>
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
