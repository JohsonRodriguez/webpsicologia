-- Cola de correos: límite de 100 envíos por día (hora de Lima). Lo que exceda
-- el límite queda pendiente y se reintenta al día siguiente vía cron.
create table public.correos_cola (
  id uuid primary key default gen_random_uuid(),
  destinatario_email text not null,
  asunto text not null,
  html text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'enviado', 'error')),
  creado_en timestamptz not null default now(),
  enviado_en timestamptz
);

create index correos_cola_estado_idx on public.correos_cola (estado, creado_en);
create index correos_cola_enviado_en_idx on public.correos_cola (enviado_en);

alter table public.correos_cola enable row level security;

-- Cualquier miembro del staff autenticado puede encolar un correo (lo hacen
-- las server actions al reportar una incidencia, asignar un rol, etc.).
-- Leer/marcar como enviado lo hace únicamente el procesador (service role),
-- así que no hay policy de select/update para el cliente autenticado.
create policy "staff encola correos" on public.correos_cola for insert
  with check (public.auth_rol() is not null);
