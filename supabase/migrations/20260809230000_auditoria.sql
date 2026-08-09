-- Bitácora de auditoría: quién hizo qué sobre qué registro y cuándo, para
-- las acciones más sensibles (cambios de rol, ciclo de vida de un caso,
-- eliminaciones de estructura académica). Solo inserción desde la app: sin
-- policy de update/delete, un registro ya escrito es inmutable.
create table public.auditoria (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id),
  accion text not null,
  entidad text not null,
  entidad_id uuid,
  detalle jsonb,
  created_at timestamptz not null default now()
);

create index auditoria_entidad_idx on public.auditoria (entidad, entidad_id);
create index auditoria_usuario_idx on public.auditoria (usuario_id);
create index auditoria_created_at_idx on public.auditoria (created_at desc);

alter table public.auditoria enable row level security;

-- Cualquier miembro del staff activo puede insertar un registro atribuido a
-- sí mismo; lo hacen las server actions justo después de ejecutar la acción
-- sensible real.
create policy "staff registra su propia accion" on public.auditoria for insert
  with check (usuario_id = auth.uid() and public.auth_rol() is not null);

-- Solo jefatura y administración pueden revisar la bitácora.
create policy "jefe y administrador leen la auditoria" on public.auditoria for select
  using (public.auth_rol() in ('jefe_psicologia', 'administrador'));
