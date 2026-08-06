import { redirect } from "next/navigation";
import { requireUsuario } from "@/lib/auth";
import { rutaInicioPara } from "@/lib/roles";

export default async function Home() {
  const usuario = await requireUsuario();
  redirect(rutaInicioPara(usuario.rol));
}
