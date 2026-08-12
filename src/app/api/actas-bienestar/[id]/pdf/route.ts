import { renderToBuffer } from "@react-pdf/renderer";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ActaBienestarPdfDocument, type ActaBienestarPdfData } from "@/lib/pdf/acta-bienestar-pdf";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const inline = new URL(request.url).searchParams.get("inline") === "1";
  await requireUsuario(["coordinador_bienestar"]);
  const supabase = await createClient();

  const { data: reunion } = await supabase
    .from("reuniones_bienestar")
    .select(
      "id, periodo, modalidad, fecha_hora, estado, observacion_padre, observacion_coordinador, alumnos(nombres, apellidos, codigo), usuarios!reuniones_bienestar_coordinador_id_fkey(nombre), firmas_bienestar(firmante_nombre, firma_data, fecha_hora)",
    )
    .eq("id", id)
    .eq("estado", "concluida")
    .maybeSingle();

  if (!reunion) {
    return new Response("Acta no encontrada", { status: 404 });
  }

  const alumno = reunion.alumnos as unknown as { nombres: string; apellidos: string; codigo: string } | null;
  const coordinador = reunion.usuarios as unknown as { nombre: string } | null;
  const firma = (reunion.firmas_bienestar as unknown as
    | { firmante_nombre: string; firma_data: string; fecha_hora: string }[]
    | null)?.[0];

  if (!alumno) {
    return new Response("Acta no encontrada", { status: 404 });
  }

  const alumnoNombre = `${alumno.nombres} ${alumno.apellidos}`;

  const data: ActaBienestarPdfData = {
    alumnoNombre,
    alumnoCodigo: alumno.codigo,
    fechaHora: new Date(reunion.fecha_hora).toLocaleString("es-PE", { dateStyle: "long", timeStyle: "short" }),
    periodo: reunion.periodo,
    modalidad: reunion.modalidad === "virtual" ? "Virtual" : "Presencial",
    coordinadorNombre: coordinador?.nombre ?? "—",
    observacionPadre: reunion.observacion_padre ?? "—",
    observacionCoordinador: reunion.observacion_coordinador ?? "—",
    firma: firma ? { firmanteNombre: firma.firmante_nombre, firmaData: firma.firma_data, fechaHora: firma.fecha_hora } : null,
    generadoEl: new Date().toLocaleString("es-PE", { dateStyle: "long", timeStyle: "short" }),
  };

  const buffer = await renderToBuffer(ActaBienestarPdfDocument({ data }));
  const nombreArchivo = `acta-bienestar-${slugify(alumnoNombre)}-${reunion.periodo.replace(/\s+/g, "-")}.pdf`;

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
