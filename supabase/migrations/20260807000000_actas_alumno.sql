-- Acta de sesión individual con el alumno: a diferencia de citas_padres (que
-- requiere firma del psicólogo Y del padre), aquí solo firma el alumno.
-- Se guarda una sola firma embebida en la fila (no amerita una tabla hija
-- como "firmas", que existe para soportar múltiples firmantes).

create table public.actas_alumno (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid not null references public.casos (id) on delete cascade,
  psicologo_id uuid not null references public.usuarios (id),
  fecha date not null,
  hora time not null,
  detalle text not null,
  observaciones text not null,
  acuerdos text not null,
  firma_alumno_nombre text not null,
  firma_alumno_data text not null,
  firma_fecha_hora timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index actas_alumno_caso_idx on public.actas_alumno (caso_id);

alter table public.actas_alumno enable row level security;

create policy "acceso actas_alumno via caso" on public.actas_alumno for select
  using (exists (
    select 1 from public.casos c
    where c.id = caso_id and (c.psicologo_id = auth.uid() or public.auth_rol() = 'jefe_psicologia')
  ));

create policy "registrar acta_alumno de caso propio" on public.actas_alumno for insert
  with check (
    psicologo_id = auth.uid()
    and exists (
      select 1 from public.casos c
      where c.id = caso_id and (c.psicologo_id = auth.uid() or public.auth_rol() = 'jefe_psicologia')
    )
  );
