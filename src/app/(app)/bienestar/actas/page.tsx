import Link from "next/link";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { nombreAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function ActasPadresPage() {
  await requireUsuario(["coordinador_bienestar"]);
  const supabase = await createClient();

  // Sin filtro de coordinador_id: la policy RLS "coordinador ve sus
  // reuniones de bienestar" ya limita las filas a las suyas.
  const { data: actas } = await supabase
    .from("reuniones_bienestar")
    .select("id, periodo, modalidad, fecha_hora, alumnos(nombres, apellidos)")
    .order("fecha_hora", { ascending: false });

  return (
    <>
      <PageHeader
        eyebrow="Bienestar Familiar"
        title="Actas padres"
        description="Reuniones de bienestar familiar registradas con los padres de familia."
      />

      <div className="rounded-xl border border-border bg-card shadow-sm">
        {(actas ?? []).length === 0 ? (
          <p className="px-4 py-14 text-center text-sm text-muted-foreground">
            Aún no registras ninguna reunión de bienestar familiar.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alumno</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Modalidad</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(actas ?? []).map((a) => {
                const alumno = a.alumnos as unknown as { nombres: string; apellidos: string } | null;
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-semibold">{alumno ? nombreAlumno(alumno) : "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{a.periodo}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.modalidad === "virtual" ? "Virtual" : "Presencial"}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {new Date(a.fecha_hora).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell>
                      <Link href={`/bienestar/${a.id}`} className="text-sm font-semibold text-primary hover:underline">
                        Ver acta
                      </Link>
                    </TableCell>
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
