import { renderToBuffer } from "@react-pdf/renderer";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActaTutoriaPdfDocument, type ActaTutoriaPdfData } from "@/lib/pdf/acta-tutoria-pdf";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inline = new URL(request.url).searchParams.get("inline") === "1";
  await requireUsuario(["profesor", "psicologo", "jefe_psicologia"]);
  const supabase = await createClient();

  const { data: acta } = await supabase
    .from("actas_tutoria")
    .select(
      "id, fecha, hora, detalle, asistentes, acuerdos_tutor, compromisos_padre, usuarios!actas_tutoria_tutor_id_fkey(nombre), alumnos(nombres, apellidos, codigo), firmas_tutoria(firmante_tipo, firmante_nombre, firma_data, fecha_hora)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!acta) {
    return new Response("Acta no encontrada", { status: 404 });
  }

  const alumno = acta.alumnos as unknown as { nombres: string; apellidos: string; codigo: string } | null;
  const tutor = acta.usuarios as unknown as { nombre: string } | null;
  const firmas = (acta.firmas_tutoria ?? []) as unknown as {
    firmante_tipo: string;
    firmante_nombre: string;
    firma_data: string;
    fecha_hora: string;
  }[];

  if (!alumno) {
    return new Response("Acta no encontrada", { status: 404 });
  }

  const data: ActaTutoriaPdfData = {
    alumnoNombre: `${alumno.nombres} ${alumno.apellidos}`,
    alumnoCodigo: alumno.codigo,
    fecha: acta.fecha,
    hora: acta.hora,
    tutorNombre: tutor?.nombre ?? "—",
    asistentes: acta.asistentes,
    detalle: acta.detalle,
    acuerdosTutor: acta.acuerdos_tutor ?? "—",
    compromisosPadre: acta.compromisos_padre ?? "—",
    firmas: firmas.map((f) => ({
      firmanteTipo: f.firmante_tipo,
      firmanteNombre: f.firmante_nombre,
      firmaData: f.firma_data,
      fechaHora: f.fecha_hora,
    })),
    generadoEl: new Date().toLocaleString("es-PE", { dateStyle: "long", timeStyle: "short" }),
  };

  const buffer = await renderToBuffer(ActaTutoriaPdfDocument({ data }));
  const nombreArchivo = `acta-tutoria-${slugify(data.alumnoNombre)}-${data.fecha}.pdf`;

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
