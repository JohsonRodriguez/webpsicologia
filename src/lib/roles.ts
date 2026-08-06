export type Rol = "profesor" | "psicologo" | "jefe_psicologia" | "administrador";

export function rolLabel(rol: Rol): string {
  return {
    profesor: "Profesor",
    psicologo: "Psicólogo",
    jefe_psicologia: "Jefe de psicólogos",
    administrador: "Administrador",
  }[rol];
}

export function rutaInicioPara(rol: Rol): string {
  if (rol === "profesor") return "/incidencias";
  if (rol === "administrador") return "/admin";
  return "/dashboard";
}
