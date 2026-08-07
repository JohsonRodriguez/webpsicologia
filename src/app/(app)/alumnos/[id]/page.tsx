import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnios, getAnioActivo, nombreAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { PillEstadoIncidencia, PillEstadoCaso, PillPrioridad } from "@/components/status-pills";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClickableRow } from "@/components/clickable-row";
import { Button } from "@/components/ui/button";
import { ActaResumen } from "@/app/(app)/casos/[id]/acta-resumen";
import { AnioSelector } from "./anio-selector";

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="font-heading text-3xl">{value}</p>
    </div>
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

  const { data: incidencias } = await supabase
    .from("incidencias")
    .select("id, motivo_id, motivo_otro, prioridad, estado, fecha_hora, catalogo_motivos(nombre)")
    .eq("alumno_id", id)
    .gte("fecha_hora", `${yearStr}-01-01`)
    .lt("fecha_hora", `${Number(yearStr) + 1}-01-01`)
    .order("fecha_hora", { ascending: false });

  const { data: casos } = await supabase
    .from("casos")
    .select("id, tipo, estado, fecha_apertura, usuarios!casos_psicologo_id_fkey(nombre)")
    .eq("alumno_id", id)
    .gte("fecha_apertura", `${yearStr}-01-01`)
    .lt("fecha_apertura", `${Number(yearStr) + 1}-01-01`)
    .order("fecha_apertura", { ascending: false });

  const casoIds = (casos ?? []).map((c) => c.id);
  const { data: citas } = await supabase
    .from("citas_padres")
    .select("id, fecha, hora, detalle, firmas(id, firmante_tipo, firmante_nombre, fecha_hora)")
    .in("caso_id", casoIds.length ? casoIds : ["00000000-0000-0000-0000-000000000000"]);

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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="flex size-13 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
              {alumno.nombres[0]}
              {alumno.apellidos[0]}
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold">{nombreAlumno(alumno)}</h2>
              <p className="font-mono text-xs text-muted-foreground">{alumno.codigo}</p>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-[150px_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Grado / sección {anioSeleccionado?.anio}</dt>
            <dd>{grados && secciones ? `${grados.nombre} "${secciones.nombre}"` : "Sin matrícula ese año"}</dd>
            <dt className="text-muted-foreground">Nivel</dt>
            <dd>{grados?.niveles?.nombre ?? "—"}</dd>
            <dt className="text-muted-foreground">Psicólogo asignado</dt>
            <dd>{(psicologoAsignado?.usuarios as unknown as { nombre: string } | null)?.nombre ?? "—"}</dd>
          </dl>
        </div>
        <div className="grid grid-cols-3 gap-3.5">
          <StatTile label={`Incidencias ${anioSeleccionado?.anio ?? ""}`} value={incidencias?.length ?? 0} />
          <StatTile label={`Casos ${anioSeleccionado?.anio ?? ""}`} value={casos?.length ?? 0} />
          <StatTile label="Actas firmadas" value={citas?.length ?? 0} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4">
          <h3 className="font-heading text-base font-semibold">Incidencias</h3>
        </div>
        {incidencias && incidencias.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidencias.map((i) => (
                <ClickableRow key={i.id} href={`/incidencias/${i.id}`}>
                  <TableCell className="tabular-nums">
                    {new Date(i.fecha_hora).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                  </TableCell>
                  <TableCell>
                    {i.motivo_otro || (i.catalogo_motivos as unknown as { nombre: string } | null)?.nombre}
                  </TableCell>
                  <TableCell>
                    <PillPrioridad prioridad={i.prioridad} />
                  </TableCell>
                  <TableCell>
                    <PillEstadoIncidencia estado={i.estado} />
                  </TableCell>
                </ClickableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">Sin incidencias en este año lectivo.</p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4">
          <h3 className="font-heading text-base font-semibold">Casos</h3>
        </div>
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
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4">
          <h3 className="font-heading text-base font-semibold">Actas de reunión con padres</h3>
        </div>
        <div className="flex flex-col gap-3 p-4">
          {citas && citas.length > 0 ? (
            citas.map((c) => <ActaResumen key={c.id} cita={c} />)
          ) : (
            <p className="text-sm text-muted-foreground">Sin actas registradas en este año lectivo.</p>
          )}
        </div>
      </div>
    </>
  );
}
