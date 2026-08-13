import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://psicologia.byron.edu.pe";
const FROM = process.env.EMAIL_FROM ?? "Psicología Lord Byron <notificaciones@myliteracyhub.com>";
const LIMITE_DIARIO = 100;

let client: Resend | null = null;
function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

function inicioDeHoyLima() {
  const fechaLima = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return new Date(`${fechaLima}T00:00:00-05:00`).toISOString();
}

// El envío nunca debe tumbar la acción que lo dispara (crear incidencia, asignar
// rol, etc.): encolar y procesar siempre atrapan sus propios errores.
async function sendEmail(params: { to: string; subject: string; html: string }) {
  try {
    const supabase = createAdminClient();
    await supabase.from("correos_cola").insert({
      destinatario_email: params.to,
      asunto: params.subject,
      html: params.html,
    });
  } catch (err) {
    console.error("No se pudo encolar el correo", err);
    return;
  }
  await procesarColaCorreos();
}

/**
 * Envía los correos pendientes respetando un límite de 100 envíos por día
 * (calendario de Lima). Lo que exceda el límite queda "pendiente" y se
 * reintenta en la siguiente llamada (otro correo del mismo día una vez que
 * haya cupo mañana, o el cron diario que barre la cola).
 */
export async function procesarColaCorreos() {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY no configurado; se omite el procesamiento de la cola de correos.");
    return;
  }

  const supabase = createAdminClient();
  const inicioHoy = inicioDeHoyLima();

  const { count: enviadosHoy } = await supabase
    .from("correos_cola")
    .select("id", { count: "exact", head: true })
    .eq("estado", "enviado")
    .gte("enviado_en", inicioHoy);

  const disponibles = LIMITE_DIARIO - (enviadosHoy ?? 0);
  if (disponibles <= 0) return;

  const { data: pendientes } = await supabase
    .from("correos_cola")
    .select("id, destinatario_email, asunto, html")
    .eq("estado", "pendiente")
    .order("creado_en", { ascending: true })
    .limit(disponibles);

  for (const correo of pendientes ?? []) {
    try {
      const { error } = await resend.emails.send({
        from: FROM,
        to: correo.destinatario_email,
        subject: correo.asunto,
        html: correo.html,
      });
      if (error) {
        console.error("Resend error", error);
        await supabase.from("correos_cola").update({ estado: "error" }).eq("id", correo.id);
      } else {
        await supabase
          .from("correos_cola")
          .update({ estado: "enviado", enviado_en: new Date().toISOString() })
          .eq("id", correo.id);
      }
    } catch (err) {
      console.error("No se pudo enviar el correo", err);
      await supabase.from("correos_cola").update({ estado: "error" }).eq("id", correo.id);
    }
  }
}

function wrapper(title: string, bodyHtml: string) {
  return `
    <div style="font-family: Poppins, -apple-system, Segoe UI, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a2b23;">
      <p style="font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #166c52; margin: 0 0 8px;">
        Departamento Psicopedagógico · Colegio Lord Byron
      </p>
      <h1 style="font-size: 19px; margin: 0 0 16px;">${title}</h1>
      ${bodyHtml}
      <a href="${APP_URL}" style="display:inline-block; margin-top: 20px; background:#166c52; color:#fff; text-decoration:none; padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: 600;">
        Ir a la plataforma
      </a>
    </div>
  `;
}

export async function enviarCorreoIncidenciaAsignada(params: {
  psicologoEmail: string;
  psicologoNombre: string;
  alumnoNombre: string;
  motivo: string;
  prioridad: string;
}) {
  await sendEmail({
    to: params.psicologoEmail,
    subject: `Nueva incidencia asignada — ${params.alumnoNombre}`,
    html: wrapper(
      "Se te asignó una nueva incidencia",
      `<p style="font-size:14px; line-height:1.5;">Hola ${params.psicologoNombre},</p>
       <p style="font-size:14px; line-height:1.5;">
         Un profesor reportó una incidencia para <strong>${params.alumnoNombre}</strong>
         (motivo: ${params.motivo}, prioridad: ${params.prioridad}) y quedó asignada a ti.
       </p>`,
    ),
  });
}

export async function enviarCorreoIncidenciaEnProceso(params: {
  profesorEmail: string;
  profesorNombre: string;
  alumnoNombre: string;
  psicologoNombre: string;
}) {
  await sendEmail({
    to: params.profesorEmail,
    subject: `Tu incidencia sobre ${params.alumnoNombre} ya está en proceso`,
    html: wrapper(
      "Tu incidencia pasó a seguimiento",
      `<p style="font-size:14px; line-height:1.5;">Hola ${params.profesorNombre},</p>
       <p style="font-size:14px; line-height:1.5;">
         El psicólogo <strong>${params.psicologoNombre}</strong> abrió un caso de seguimiento a partir de la
         incidencia que reportaste sobre <strong>${params.alumnoNombre}</strong>. Ya está siendo atendida.
       </p>`,
    ),
  });
}

export async function enviarCorreoRolAsignado(params: {
  usuarioEmail: string;
  usuarioNombre: string;
  rolLabel: string;
}) {
  await sendEmail({
    to: params.usuarioEmail,
    subject: "Tu cuenta ya está activa",
    html: wrapper(
      "Tu cuenta ya está activa",
      `<p style="font-size:14px; line-height:1.5;">Hola ${params.usuarioNombre},</p>
       <p style="font-size:14px; line-height:1.5;">
         Un administrador te asignó el rol de <strong>${params.rolLabel}</strong> en la plataforma
         de psicología del colegio. Ya puedes ingresar con tu cuenta de Google institucional.
       </p>`,
    ),
  });
}
