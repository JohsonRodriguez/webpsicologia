import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Info, Link2 } from "lucide-react";
import { requireUsuario } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { nombreAlumno } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { InfoItem } from "@/components/detail-ui";
import { CopyLinkButton } from "./copy-link-button";
import { CerrarReunionForm } from "./cerrar-reunion-form";

export default async function ReunionBienestarDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUsuario(["coordinador_bienestar"]);
  const supabase = await createClient();

  const { data: reunion } = await supabase
    .from("reuniones_bienestar")
    .select(
      "id, periodo, modalidad, fecha_hora, estado, token, observacion_padre, observacion_coordinador, alumnos(nombres, apellidos, codigo), firmas_bienestar(firmante_nombre, ip, fecha_hora, firma_data)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!reunion) notFound();

  const alumno = reunion.alumnos as unknown as { nombres: string; apellidos: string; codigo: string } | null;
  const firma = (reunion.firmas_bienestar as unknown as
    | { firmante_nombre: string; ip: string; fecha_hora: string; firma_data: string }[]
    | null)?.[0];

  if (!alumno) notFound();

  const esperandoPadre = reunion.estado === "pendiente" && !reunion.observacion_padre;
  const esperandoCierre = reunion.estado === "pendiente" && !!reunion.observacion_padre;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://psicologia.byron.edu.pe";
  const enlace = reunion.token ? `${appUrl}/bienestar-padre/${reunion.token}` : "";

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        render={
          <Link href="/bienestar">
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        }
      />
      <PageHeader
        eyebrow="Bienestar Familiar"
        title={nombreAlumno(alumno)}
        description={`${alumno.codigo} · ${reunion.periodo} · ${reunion.modalidad === "virtual" ? "Virtual" : "Presencial"}`}
      />

      {esperandoPadre ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Link2 className="size-4" />
            Esperando respuesta del padre / madre / apoderado
          </div>
          <p className="text-sm text-muted-foreground">
            Comparte este enlace para que llene su observación y firme desde su propio dispositivo.
          </p>
          <div className="flex w-full items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-sm break-all">
            {enlace}
          </div>
          <CopyLinkButton link={enlace} />
        </div>
      ) : (
        <div className="flex flex-col gap-3.5 rounded-xl border border-border bg-card p-5 shadow-sm">
          <InfoItem icon={Info} label="Fecha y hora">
            {new Date(reunion.fecha_hora).toLocaleString("es-PE", { dateStyle: "long", timeStyle: "short" })}
          </InfoItem>

          <div className="flex flex-col gap-1.5 border-t border-border pt-3.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Observación del padre de familia</p>
            <p className="text-sm whitespace-pre-line">{reunion.observacion_padre}</p>
          </div>

          {esperandoCierre ? (
            <div className="flex flex-col gap-1.5 border-t border-border pt-3.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Observación del coordinador</p>
              <CerrarReunionForm reunionId={reunion.id} />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase">Observación del coordinador</p>
              <p className="text-sm whitespace-pre-line">{reunion.observacion_coordinador}</p>
            </div>
          )}
        </div>
      )}

      {!esperandoPadre && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase">Firma</p>
          {firma ? (
            <div className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={firma.firma_data} alt="Firma del padre / madre / apoderado" className="h-28 rounded-md border border-dashed border-border bg-secondary object-contain p-2" />
              <p className="text-sm font-semibold">{firma.firmante_nombre}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(firma.fecha_hora).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })} · IP{" "}
                {firma.ip}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin firma registrada.</p>
          )}
        </div>
      )}
    </>
  );
}
