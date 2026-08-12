-- Reunión virtual: el coordinador genera un enlace público de un solo uso
-- (token) para que el padre de familia llene su observación y firme desde
-- su propio dispositivo. Hasta que el padre responde y el coordinador
-- redacta su observación de cierre, la reunión queda en estado 'pendiente'
-- con ambas observaciones en null.
alter table public.reuniones_bienestar
  add column token uuid unique,
  alter column observacion_padre drop not null,
  alter column observacion_coordinador drop not null;

create policy "coordinador cierra su reunion de bienestar pendiente" on public.reuniones_bienestar
  for update
  using (auth_rol() = 'coordinador_bienestar' and coordinador_id = auth.uid() and estado = 'pendiente')
  with check (auth_rol() = 'coordinador_bienestar' and coordinador_id = auth.uid());
