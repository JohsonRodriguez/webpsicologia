/**
 * IMPECCABLE DIRECTION — Ficha del alumno (surface concept-seed index 3)
 * THESIS: one continuous student record (Product Principle #1), not four
 * identical stacked tables pretending to be silos.
 * OWN-WORLD: institutional green/Poppins, solid/soft status pairs, SeccionCard —
 * unchanged. No new color, font, or radius introduced.
 * STORY: a psicólogo scans one student's whole history at a glance and jumps
 * into any past case without hunting across sections.
 * FIRST VIEWPORT: fixed identity panel (avatar, matrícula, psicólogo asignado,
 * consolidated status) left; one chronological event thread right.
 * FORM: two-pane record, assigned by concept-seed (surface, key e7b7bfed, index 3).
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the
 * finish review, the verdict, and DESIGN.md.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FolderOpen, FileCheck2, GraduationCap, UserRound, Users2 } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnios, getAnioActivo, nombreAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { PillEstadoCaso } from "@/components/status-pills";
import { Button } from "@/components/ui/button";
import { InfoItem, iniciales } from "@/components/detail-ui";
import { PdfDownloadLink } from "@/components/pdf-download-link";
import { AnioSelector } from "./anio-selector";

function PillFirmado({ firmado }: { firmado: boolean }) {
  return firmado ? (
    <span className="inline-flex items-center rounded-full bg-good px-2.5 py-1 text-xs font-bold whitespace-nowrap text-white">
      Firmada
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-warn px-2.5 py-1 text-xs font-bold whitespace-nowrap text-white">
      Pendiente
    </span>
  );
}

const TIPO_EVENTO: Record<string, { label: string; className: string }> = {
  caso: { label: "Caso", className: "bg-primary/10 text-primary" },
  acta_padres: { label: "Acta con padres", className: "bg-info-soft text-info" },
  acta_docente: { label: "Acta de docente", className: "bg-purple-soft text-purple" },
  acta_alumno: { label: "Acta de sesión", className: "bg-good-soft text-good" },
};

function PillTipo({ tipo }: { tipo: keyof typeof TIPO_EVENTO }) {
  const t = TIPO_EVENTO[tipo];
  return (
    <span className={`inline-flex flex-none items-center rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${t.className}`}>
      {t.label}
    </span>
  );
}

type EventoHistorial = {
  id: string;
  tipo: keyof typeof TIPO_EVENTO;
  fecha: string;
  titulo: string;
  meta?: string;
  firmada?: boolean;
  estadoCaso?: string;
  href?: string;
  pdfHref?: string;
};

export default async function FichaAlumnoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ anio?: string }>;
}) {
  const { id } = await params;
  const { anio: anioParam } = await searchParams;
  await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();

  const { data: alumno } = await supabase.from("alumnos").select("id, nombres, apellidos, codigo").eq("id", id).maybeSingle();
  if (!alumno) notFound();

  const anios = await getAnios(supabase);
  const activo = await getAnioActivo(supabase);
  const anioSeleccionado = anios.find((a) => a.id === anioParam) ?? activo ?? anios[0];

  const { data: matricula } = await supabase
    .from("matriculas")
    .select("grado_id, seccion_id, grados(nombre, nivel_id, niveles(nombre)), secciones(nombre)")
    .eq("alumno_id", id)
    .eq("anio_academico_id", anioSeleccionado?.id ?? "")
    .maybeSingle();

  const grados = matricula?.grados as unknown as { nombre: string; nivel_id: string; niveles: { nombre: string } | null } | null;
  const secciones = matricula?.secciones as unknown as { nombre: string } | null;

  const { data: psicologoAsignado } = matricula
    ? await supabase.from("psicologo_grado").select("usuarios(nombre)").eq("grado_id", matricula.grado_id).maybeSingle()
    : { data: null };

  const yearStr = String(anioSeleccionado?.anio ?? "");

  const { data: casos } = await supabase
    .from("casos")
    .select("id, tipo, estado, fecha_apertura, usuarios!casos_psicologo_id_fkey(nombre)")
    .eq("alumno_id", id)
    .gte("fecha_apertura", `${yearStr}-01-01`)
    .lt("fecha_apertura", `${Number(yearStr) + 1}-01-01`)
    .order("fecha_apertura", { ascending: false });

  const casoIds = (casos ?? []).map((c) => c.id);
  const [{ data: citas }, { data: actasAlumno }, { data: actasDocente }] = await Promise.all([
    supabase
      .from("citas_padres")
      .select("id, fecha, detalle, firmas(id)")
      .in("caso_id", casoIds.length ? casoIds : ["00000000-0000-0000-0000-000000000000"])
      .order("fecha", { ascending: false }),
    supabase
      .from("actas_alumno")
      .select("id, fecha, detalle, firma_alumno_nombre")
      .in("caso_id", casoIds.length ? casoIds : ["00000000-0000-0000-0000-000000000000"])
      .order("fecha", { ascending: false }),
    supabase
      .from("actas_docente_padres")
      .select("id, fecha, detalle, usuarios!actas_docente_padres_profesor_id_fkey(nombre), firmas_acta_docente(id)")
      .eq("alumno_id", id)
      .gte("fecha", `${yearStr}-01-01`)
      .lt("fecha", `${Number(yearStr) + 1}-01-01`)
      .order("fecha", { ascending: false }),
  ]);

  const actasFirmadas = (citas ?? []).filter((c) => (c.firmas?.length ?? 0) >= 1).length +
    (actasAlumno ?? []).filter((a) => a.firma_alumno_nombre).length +
    (actasDocente ?? []).filter((a) => (a.firmas_acta_docente?.length ?? 0) >= 1).length;

  const totalActas = (citas?.length ?? 0) + (actasAlumno?.length ?? 0) + (actasDocente?.length ?? 0);
  const firmasPendientes = totalActas - actasFirmadas;
  const casosAbiertos = (casos ?? []).filter((c) => c.estado !== "cerrado").length;

  // Un solo hilo cronológico en vez de cuatro tablas idénticas: el registro
  // continuo es el principio del producto, no solo un dato del modelo.
  const eventos: EventoHistorial[] = [
    ...(casos ?? []).map((c): EventoHistorial => ({
      id: c.id,
      tipo: "caso",
      fecha: c.fecha_apertura,
      titulo: c.tipo === "caso_1" ? "Caso desde incidencia" : "Caso directo",
      meta: (c.usuarios as unknown as { nombre: string } | null)?.nombre,
      estadoCaso: c.estado,
      href: `/casos/${c.id}`,
    })),
    ...(citas ?? []).map((c): EventoHistorial => {
      const firmada = (c.firmas?.length ?? 0) >= 1;
      return {
        id: c.id,
        tipo: "acta_padres",
        fecha: c.fecha,
        titulo: c.detalle,
        firmada,
        pdfHref: firmada ? `/api/citas/${c.id}/pdf` : undefined,
      };
    }),
    ...(actasDocente ?? []).map((a): EventoHistorial => {
      const firmada = (a.firmas_acta_docente?.length ?? 0) >= 1;
      return {
        id: a.id,
        tipo: "acta_docente",
        fecha: a.fecha,
        titulo: a.detalle,
        meta: (a.usuarios as unknown as { nombre: string } | null)?.nombre,
        firmada,
        pdfHref: firmada ? `/api/actas-docente/${a.id}/pdf` : undefined,
      };
    }),
    ...(actasAlumno ?? []).map((a): EventoHistorial => {
      const firmada = Boolean(a.firma_alumno_nombre);
      return {
        id: a.id,
        tipo: "acta_alumno",
        fecha: a.fecha,
        titulo: a.detalle,
        firmada,
        pdfHref: firmada ? `/api/actas-alumno/${a.id}/pdf` : undefined,
      };
    }),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        render={
          <Link href="/alumnos">
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        }
      />
      <PageHeader
        eyebrow="Ficha del alumno"
        title={nombreAlumno(alumno)}
        description="Historial completo organizado por año lectivo."
        actions={<AnioSelector anios={anios} seleccionado={anioSeleccionado?.id ?? ""} />}
      />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <aside className="flex flex-col gap-3.5 lg:sticky lg:top-20 lg:w-72 lg:flex-none">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
            <div className="flex size-16 flex-none items-center justify-center rounded-full bg-primary/10 font-heading text-xl font-bold text-primary">
              {iniciales(alumno.nombres, alumno.apellidos)}
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold text-foreground">{nombreAlumno(alumno)}</h1>
              <p className="font-mono text-xs text-muted-foreground">{alumno.codigo}</p>
            </div>

            {casosAbiertos > 0 ? (
              <span className="inline-flex items-center rounded-full bg-warn px-3 py-1 text-xs font-bold whitespace-nowrap text-white">
                {casosAbiertos} {casosAbiertos === 1 ? "caso activo" : "casos activos"}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-good px-3 py-1 text-xs font-bold whitespace-nowrap text-white">
                Sin casos activos
              </span>
            )}
            {firmasPendientes > 0 && (
              <span className="inline-flex items-center rounded-full bg-warn-soft px-3 py-1 text-xs font-bold whitespace-nowrap text-warn">
                {firmasPendientes} {firmasPendientes === 1 ? "acta pendiente de firma" : "actas pendientes de firma"}
              </span>
            )}

            <div className="flex w-full flex-col gap-2.5 border-t border-border pt-3.5 text-left">
              <InfoItem icon={GraduationCap} label={`Grado y sección ${anioSeleccionado?.anio ?? ""}`}>
                {grados && secciones ? `${grados.nombre} "${secciones.nombre}"` : "Sin matrícula ese año"}
              </InfoItem>
              <InfoItem icon={GraduationCap} label="Nivel">
                {grados?.niveles?.nombre ?? "—"}
              </InfoItem>
              <InfoItem icon={UserRound} label="Psicólogo asignado">
                {(psicologoAsignado?.usuarios as unknown as { nombre: string } | null)?.nombre ?? "—"}
              </InfoItem>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
              <FolderOpen className="size-4 text-primary" />
              <p className="font-heading mt-1.5 text-xl font-bold">{casos?.length ?? 0}</p>
              <p className="text-xs font-medium text-muted-foreground">Casos {anioSeleccionado?.anio ?? ""}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
              <FileCheck2 className="size-4 text-good" />
              <p className="font-heading mt-1.5 text-xl font-bold">{actasFirmadas}</p>
              <p className="text-xs font-medium text-muted-foreground">Actas firmadas</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-1.5 border-b border-border p-4 text-primary">
            <Users2 className="size-4" />
            <h3 className="font-heading text-base font-semibold text-foreground">Historial del año</h3>
          </div>

          {eventos.length === 0 ? (
            <p className="px-4 py-14 text-center text-sm text-muted-foreground">
              Sin casos ni actas registradas en este año lectivo.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {eventos.map((e) => {
                const contenido = (
                  <>
                    <span className="flex-none text-xs tabular-nums text-muted-foreground sm:w-24">
                      {new Date(e.fecha + (e.fecha.length === 10 ? "T00:00:00" : "")).toLocaleDateString("es-PE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <PillTipo tipo={e.tipo} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.titulo}</p>
                      {e.meta && <p className="truncate text-xs text-muted-foreground">{e.meta}</p>}
                    </div>
                    <div className="flex flex-none items-center gap-2">
                      {e.estadoCaso ? <PillEstadoCaso estado={e.estadoCaso} /> : <PillFirmado firmado={Boolean(e.firmada)} />}
                      {e.pdfHref && <PdfDownloadLink href={e.pdfHref} />}
                    </div>
                  </>
                );
                const claseFila =
                  "flex flex-col gap-2.5 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-3.5";
                return e.href ? (
                  <Link key={`${e.tipo}-${e.id}`} href={e.href} className={`${claseFila} transition-colors duration-150 ease-(--ease-out) hover:bg-secondary`}>
                    {contenido}
                  </Link>
                ) : (
                  <div key={`${e.tipo}-${e.id}`} className={claseFila}>
                    {contenido}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
