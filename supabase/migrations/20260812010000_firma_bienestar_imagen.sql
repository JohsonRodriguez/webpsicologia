-- La firma en pantalla de bienestar guarda tanto el trazo dibujado (imagen,
-- igual que firmas/firmas_tutoria/firmas_acta_docente) como la constancia
-- de nombre/IP/fecha-hora que ya tenía la tabla. Tabla sin filas todavía,
-- así que no hace falta un default temporal.
alter table public.firmas_bienestar add column firma_data text not null;
