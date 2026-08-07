import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FolderOpen, FileCheck2, GraduationCap, UserRound, FileText } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnios, getAnioActivo, nombreAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { PillEstadoCaso } from "@/components/status-pills";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableRow } from "@/components/clickable-row";
import { Button } from "@/components/ui/button";
import { InfoItem, SeccionCard, iniciales } from "@/components/detail-ui";
import { PdfDownloadLink } from "@/components/pdf-download-link";
import { AnioSelector } from "./anio-selector";

const TONO: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  warn: "bg-warn-soft text-warn",
  good: "bg-good-soft text-good",
};

function StatTile({
  label,
  value,
  icon: Icon,
  tono,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tono: keyof typeof TONO;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className={`flex size-11 flex-none items-center justify-center rounded-lg ${TONO[tono]}`}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="font-heading text-2xl leading-none font-bold">{value}</p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function PillFirmado({ firmado }: { firmado: boolean }) {
  return firmado ? (
    <span className="inline-flex items-center rounded-full bg-good px-2.5 py-1 text-xs font-bold text-white">
      Firmada
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-warn px-2.5 py-1 text-xs font-bold text-white">
      Pendiente
    </span>
  );
}

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
  const [{ data: citas }, { data: actasAlumno }] = await Promise.all([
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
  ]);

  const actasFirmadas = (citas ?? []).filter((c) => (c.firmas?.length ?? 0) >= 1).length +
    (actasAlumno ?? []).filter((a) => a.firma_alumno_nombre).length;

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

      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-14 flex-none items-center justify-center rounded-full bg-primary/10 font-heading text-lg font-bold text-primary">
            {iniciales(alumno.nombres, alumno.apellidos)}
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-xl font-bold text-foreground">{nombreAlumno(alumno)}</h1>
            <p className="font-mono text-xs text-muted-foreground">{alumno.codigo}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
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

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <StatTile label={`Casos ${anioSeleccionado?.anio ?? ""}`} value={casos?.length ?? 0} icon={FolderOpen} tono="primary" />
        <StatTile label="Actas firmadas" value={actasFirmadas} icon={FileCheck2} tono="good" />
      </div>

      <SeccionCard icon={FolderOpen} titulo="Casos">
        {casos && casos.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Apertura</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Psicólogo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {casos.map((c) => (
                <ClickableRow key={c.id} href={`/casos/${c.id}`}>
                  <TableCell className="tabular-nums">
                    {new Date(c.fecha_apertura).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                  </TableCell>
                  <TableCell>{c.tipo === "caso_1" ? "Desde incidencia" : "Directo"}</TableCell>
                  <TableCell>{(c.usuarios as unknown as { nombre: string } | null)?.nombre}</TableCell>
                  <TableCell>
                    <PillEstadoCaso estado={c.estado} />
                  </TableCell>
                </ClickableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">Sin casos en este año lectivo.</p>
        )}
      </SeccionCard>

      <SeccionCard icon={FileText} titulo="Actas de reunión con padres">
        {citas && citas.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Firmado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {citas.map((c) => {
                const firmada = (c.firmas?.length ?? 0) >= 1;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="tabular-nums">
                      {new Date(c.fecha + "T00:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{c.detalle}</TableCell>
                    <TableCell>
                      <PillFirmado firmado={firmada} />
                    </TableCell>
                    <TableCell>{firmada && <PdfDownloadLink href={`/api/citas/${c.id}/pdf`} />}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">Sin actas registradas en este año lectivo.</p>
        )}
      </SeccionCard>

      <SeccionCard icon={FileText} titulo="Actas de sesión con el alumno">
        {actasAlumno && actasAlumno.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Firmado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actasAlumno.map((a) => {
                const firmada = Boolean(a.firma_alumno_nombre);
                return (
                  <TableRow key={a.id}>
                    <TableCell className="tabular-nums">
                      {new Date(a.fecha + "T00:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{a.detalle}</TableCell>
                    <TableCell>
                      <PillFirmado firmado={firmada} />
                    </TableCell>
                    <TableCell>{firmada && <PdfDownloadLink href={`/api/actas-alumno/${a.id}/pdf`} />}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Sin actas de sesión individual en este año lectivo.
          </p>
        )}
      </SeccionCard>
    </>
  );
}
