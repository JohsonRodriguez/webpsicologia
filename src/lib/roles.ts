export type Rol = "profesor" | "psicologo" | "jefe_psicologia" | "administrador" | "coordinador_bienestar";

export function rolLabel(rol: Rol): string {
  return {
    profesor: "Profesor",
    psicologo: "Psicólogo",
    jefe_psicologia: "Jefe de psicólogos",
    administrador: "Administrador",
    coordinador_bienestar: "Coordinador de Bienestar Familiar",
  }[rol];
}

export function rutaInicioPara(rol: Rol): string {
  if (rol === "profesor") return "/incidencias";
  if (rol === "administrador") return "/admin";
  if (rol === "coordinador_bienestar") return "/bienestar";
  return "/dashboard";
}
