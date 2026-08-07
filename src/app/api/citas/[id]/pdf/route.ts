import { renderToBuffer } from "@react-pdf/renderer";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActaPdfDocument, type ActaPdfData } from "@/lib/pdf/acta-pdf";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUsuario(["psicologo", "jefe_psicologia"]);
  const supabase = await createClient();

  const { data: cita } = await supabase
    .from("citas_padres")
    .select(
      "id, fecha, hora, detalle, asistentes, obs_psicologo, obs_padre, acuerdos_psicologo, compromisos_padre, usuarios!citas_padres_psicologo_id_fkey(nombre), casos(alumnos(nombres, apellidos, codigo)), firmas(firmante_tipo, firmante_nombre, firma_data, fecha_hora)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!cita) {
    return new Response("Acta no encontrada", { status: 404 });
  }

  const alumno = (cita.casos as unknown as { alumnos: { nombres: string; apellidos: string; codigo: string } | null })
    ?.alumnos;
  const psicologo = cita.usuarios as unknown as { nombre: string } | null;
  const firmas = (cita.firmas ?? []) as unknown as {
    firmante_tipo: string;
    firmante_nombre: string;
    firma_data: string;
    fecha_hora: string;
  }[];

  if (!alumno) {
    return new Response("Acta no encontrada", { status: 404 });
  }

  const data: ActaPdfData = {
    alumnoNombre: `${alumno.nombres} ${alumno.apellidos}`,
    alumnoCodigo: alumno.codigo,
    fecha: cita.fecha,
    hora: cita.hora,
    psicologoNombre: psicologo?.nombre ?? "—",
    asistentes: cita.asistentes,
    detalle: cita.detalle,
    obsPsicologo: cita.obs_psicologo ?? "—",
    obsPadre: cita.obs_padre ?? "—",
    acuerdosPsicologo: cita.acuerdos_psicologo ?? "—",
    compromisosPadre: cita.compromisos_padre ?? "—",
    firmas: firmas.map((f) => ({
      firmanteTipo: f.firmante_tipo,
      firmanteNombre: f.firmante_nombre,
      firmaData: f.firma_data,
      fechaHora: f.fecha_hora,
    })),
    generadoEl: new Date().toLocaleString("es-PE", { dateStyle: "long", timeStyle: "short" }),
  };

  const buffer = await renderToBuffer(ActaPdfDocument({ data }));
  const nombreArchivo = `acta-${slugify(data.alumnoNombre)}-${data.fecha}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
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
