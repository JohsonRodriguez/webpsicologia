import { renderToBuffer } from "@react-pdf/renderer";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActaAlumnoPdfDocument, type ActaAlumnoPdfData } from "@/lib/pdf/acta-alumno-pdf";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inline = new URL(request.url).searchParams.get("inline") === "1";
  await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();

  const { data: acta } = await supabase
    .from("actas_alumno")
    .select(
      "id, fecha, hora, detalle, observaciones, declaracion_alumno, acuerdos, firma_alumno_nombre, firma_alumno_data, firma_fecha_hora, usuarios!actas_alumno_psicologo_id_fkey(nombre), casos(alumnos(nombres, apellidos, codigo))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!acta) {
    return new Response("Acta no encontrada", { status: 404 });
  }

  const alumno = (acta.casos as unknown as { alumnos: { nombres: string; apellidos: string; codigo: string } | null })
    ?.alumnos;
  const psicologo = acta.usuarios as unknown as { nombre: string } | null;

  if (!alumno) {
    return new Response("Acta no encontrada", { status: 404 });
  }

  if (!acta.firma_alumno_data || !acta.firma_alumno_nombre || !acta.firma_fecha_hora) {
    return new Response("El acta aún no está firmada por el alumno.", { status: 400 });
  }

  const data: ActaAlumnoPdfData = {
    alumnoNombre: `${alumno.nombres} ${alumno.apellidos}`,
    alumnoCodigo: alumno.codigo,
    fecha: acta.fecha,
    hora: acta.hora,
    psicologoNombre: psicologo?.nombre ?? "—",
    detalle: acta.detalle,
    observaciones: acta.observaciones,
    declaracionAlumno: acta.declaracion_alumno ?? "—",
    acuerdos: acta.acuerdos ?? "—",
    firmaAlumnoNombre: acta.firma_alumno_nombre,
    firmaAlumnoData: acta.firma_alumno_data,
    firmaFechaHora: acta.firma_fecha_hora,
    generadoEl: new Date().toLocaleString("es-PE", { dateStyle: "long", timeStyle: "short" }),
  };

  const buffer = await renderToBuffer(ActaAlumnoPdfDocument({ data }));
  const nombreArchivo = `acta-alumno-${slugify(data.alumnoNombre)}-${data.fecha}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${nombreArchivo}"`,
    },
  });
}

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
