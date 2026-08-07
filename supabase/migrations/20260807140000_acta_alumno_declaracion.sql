-- El acta con el alumno ahora se llena en dos partes: el psicólogo registra
-- fecha/hora/motivo/observaciones, y luego el alumno completa su declaración
-- y compromiso (en momentos distintos si hace falta) antes de firmar.
alter table public.actas_alumno
  add column declaracion_alumno text,
  alter column acuerdos drop not null,
  alter column firma_alumno_nombre drop not null,
  alter column firma_alumno_data drop not null,
  alter column firma_fecha_hora drop not null,
  alter column firma_fecha_hora drop default;

create policy "actualizar acta_alumno de caso propio" on public.actas_alumno for update
  using (exists (
    select 1 from public.casos c
    where c.id = caso_id and (c.psicologo_id = auth.uid() or public.auth_rol() = 'jefe_psicologia')
  ))
  with check (exists (
    select 1 from public.casos c
    where c.id = caso_id and (c.psicologo_id = auth.uid() or public.auth_rol() = 'jefe_psicologia')
  ));
