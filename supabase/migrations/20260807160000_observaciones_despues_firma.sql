-- Las observaciones del psicólogo en el acta con el alumno ahora se
-- escriben después de que el alumno firma, no al crear el acta.
alter table public.actas_alumno alter column observaciones drop not null;
