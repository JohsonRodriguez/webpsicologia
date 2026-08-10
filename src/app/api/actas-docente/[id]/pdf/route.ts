import { renderToBuffer } from "@react-pdf/renderer";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActaDocentePdfDocument, type ActaDocentePdfData } from "@/lib/pdf/acta-docente-pdf";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inline = new URL(request.url).searchParams.get("inline") === "1";
  await requireUsuario(["profesor", "psicologo", "jefe_psicologia"]);
  const supabase = await createClient();

  const { data: acta } = await supabase
    .from("actas_docente_padres")
    .select(
      "id, fecha, hora, detalle, asistentes, acuerdos_docente, compromisos_padre, usuarios!actas_docente_padres_profesor_id_fkey(nombre), alumnos(nombres, apellidos, codigo), firmas_acta_docente(firmante_tipo, firmante_nombre, firma_data, fecha_hora)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!acta) {
    return new Response("Acta no encontrada", { status: 404 });
  }

  const alumno = acta.alumnos as unknown as { nombres: string; apellidos: string; codigo: string } | null;
  const docente = acta.usuarios as unknown as { nombre: string } | null;
  const firmas = (acta.firmas_acta_docente ?? []) as unknown as {
    firmante_tipo: string;
    firmante_nombre: string;
    firma_data: string;
    fecha_hora: string;
  }[];

  if (!alumno) {
    return new Response("Acta no encontrada", { status: 404 });
  }

  const data: ActaDocentePdfData = {
    alumnoNombre: `${alumno.nombres} ${alumno.apellidos}`,
    alumnoCodigo: alumno.codigo,
    fecha: acta.fecha,
    hora: acta.hora,
    docenteNombre: docente?.nombre ?? "—",
    asistentes: acta.asistentes,
    detalle: acta.detalle,
    acuerdosDocente: acta.acuerdos_docente ?? "—",
    compromisosPadre: acta.compromisos_padre ?? "—",
    firmas: firmas.map((f) => ({
      firmanteTipo: f.firmante_tipo,
      firmanteNombre: f.firmante_nombre,
      firmaData: f.firma_data,
      fechaHora: f.fecha_hora,
    })),
    generadoEl: new Date().toLocaleString("es-PE", { dateStyle: "long", timeStyle: "short" }),
  };

  const buffer = await renderToBuffer(ActaDocentePdfDocument({ data }));
  const nombreArchivo = `acta-docente-${slugify(data.alumnoNombre)}-${data.fecha}.pdf`;

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
