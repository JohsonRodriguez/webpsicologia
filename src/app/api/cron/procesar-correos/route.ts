import { NextResponse } from "next/server";
import { procesarColaCorreos } from "@/lib/email";

// Vercel Cron agrega automáticamente "Authorization: Bearer <CRON_SECRET>"
// al invocar esta ruta, siempre que la variable de entorno CRON_SECRET esté
// configurada en el proyecto. Cualquier otra llamada sin ese header se rechaza.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  await procesarColaCorreos();
  return NextResponse.json({ ok: true });
}
