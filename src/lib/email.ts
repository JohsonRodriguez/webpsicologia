import "server-only";
import { Resend } from "resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://psicologia.myliteracyhub.com";
const FROM = process.env.EMAIL_FROM ?? "Psicología Lord Byron <notificaciones@myliteracyhub.com>";

let client: Resend | null = null;
function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

// El envío nunca debe tumbar la acción que lo dispara (crear incidencia, asignar
// rol, etc.): si Resend no está configurado o falla, solo se registra el error.
async function sendEmail(params: { to: string; subject: string; html: string }) {
  const resend = getClient();
  if (!resend) {
    console.warn("RESEND_API_KEY no configurado; se omite el envío de correo:", params.subject);
    return;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, ...params });
    if (error) console.error("Resend error", error);
  } catch (err) {
    console.error("No se pudo enviar el correo", err);
  }
}

function wrapper(title: string, bodyHtml: string) {
  return `
    <div style="font-family: Poppins, -apple-system, Segoe UI, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a2b23;">
      <p style="font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #166c52; margin: 0 0 8px;">
        Psicología Escolar · Colegio Lord Byron
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
