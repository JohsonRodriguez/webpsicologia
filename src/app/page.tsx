import { redirect } from "next/navigation";
import { requireUsuario, rutaInicioPara } from "@/lib/auth";

export default async function Home() {
  const usuario = await requireUsuario();
  redirect(rutaInicioPara(usuario.rol));
}
