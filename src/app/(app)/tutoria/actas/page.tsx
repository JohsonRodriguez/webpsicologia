import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAnioActivo, nombreAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PdfDownloadLink } from "@/components/pdf-download-link";

function resumenMotivo(detalle: string) {
  const palabras = detalle.trim().split(/\s+/);
  if (palabras.length <= 3) return detalle;
  return `${palabras.slice(0, 3).join(" ")}…`;
}

export default async function TutoriaActasPage() {
  const usuario = await requireUsuario(["profesor"]);
  const supabase = await createClient();
  const anioActivo = await getAnioActivo(supabase);

  const { data: aulas } = await supabase
    .from("tutoria_aula")
    .select("seccion_id")
    .eq("usuario_id", usuario.id)
    .eq("anio_academico_id", anioActivo?.id ?? "")
    .is("fecha_fin", null);

  const seccionIds = (aulas ?? []).map((a) => a.seccion_id);

  const { data: matriculas } = seccionIds.length
    ? await supabase.from("matriculas").select("alumno_id").in("seccion_id", seccionIds).eq("anio_academico_id", anioActivo?.id ?? "")
    : { data: [] };
  const totalAlumnos = (matriculas ?? []).length;

  // Sin filtro de tutor_id: la policy RLS "tutor ve sus actas de tutoria"
  // ya limita las filas a las suyas.
  const { data: actas } = await supabase
    .from("actas_tutoria")
    .select("id, fecha, detalle, alumno_id, alumnos(nombres, apellidos), firmas_tutoria(id)")
    .order("fecha", { ascending: false });

  const alumnosConActa = new Set((actas ?? []).map((a) => a.alumno_id));
  const completadas = alumnosConActa.size;
  const faltantes = Math.max(totalAlumnos - completadas, 0);

  return (
    <>
      <PageHeader
        eyebrow="Tutoría"
        title="Actas de tutoría"
        description="Reuniones con padres registradas como parte de tu tutoría de aula."
        actions={
          <Button
            size="sm"
            disabled={seccionIds.length === 0}
            render={
              <Link href="/tutoria/nueva">
                <Plus className="size-4" />
                Registrar reunión
              </Link>
            }
          />
        }
      />

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Alumnos en tu aula</p>
          <p className="font-heading text-3xl">{totalAlumnos}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Completadas</p>
          <p className="font-heading text-3xl text-good">{completadas}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Faltantes</p>
          <p className="font-heading text-3xl text-warn">{faltantes}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        {(actas ?? []).length === 0 ? (
          <p className="px-4 py-14 text-center text-sm text-muted-foreground">
            {seccionIds.length === 0
              ? "No tienes ningún aula asignada como tutor este año lectivo."
              : "Aún no registras ninguna reunión de tutoría."}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alumno</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(actas ?? []).map((a) => {
                const alumno = a.alumnos as unknown as { nombres: string; apellidos: string } | null;
                const firmada = (a.firmas_tutoria?.length ?? 0) >= 1;
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-semibold">{alumno ? nombreAlumno(alumno) : "—"}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {new Date(a.fecha + "T00:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{resumenMotivo(a.detalle)}</TableCell>
                    <TableCell>{firmada && <PdfDownloadLink href={`/api/actas-tutoria/${a.id}/pdf`} />}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </>
  );
}
