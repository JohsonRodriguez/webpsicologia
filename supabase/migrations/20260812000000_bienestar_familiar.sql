-- Nuevo rol: Coordinador de Bienestar Familiar. Módulo de satisfacción
-- familiar, independiente y confidencial: no tiene relación con
-- casos/incidencias/notas de seguimiento de psicología, y ningún otro rol
-- (ni psicólogo, ni jefatura) tiene visibilidad de estas actas — solo el
-- propio coordinador que las creó y el administrador (para gestión).

alter table public.usuarios drop constraint usuarios_rol_check;
alter table public.usuarios add constraint usuarios_rol_check
  check (rol = any (array['profesor', 'psicologo', 'jefe_psicologia', 'administrador', 'coordinador_bienestar']));

-- Asignación de qué nivel atiende cada coordinador. A diferencia de
-- psicologo_grado, el administrador la reasigna libremente (delete+insert),
-- sin historial — así lo especifica el modelo de datos pedido.
create table public.coordinador_nivel (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  nivel_id uuid not null references public.niveles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (usuario_id, nivel_id)
);

create table public.reuniones_bienestar (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.alumnos (id),
  coordinador_id uuid not null references public.usuarios (id),
  anio_academico_id uuid not null references public.anios_academicos (id),
  periodo text not null,
  modalidad text not null check (modalidad in ('virtual', 'presencial')),
  fecha_hora timestamptz not null,
  observacion_padre text not null,
  observacion_coordinador text not null,
  estado text not null default 'concluida' check (estado in ('pendiente', 'concluida')),
  created_at timestamptz not null default now()
);

-- Un solo firmante (el padre/madre) por reunión — la reunión se cierra al
-- firmar, no hay firma separada del coordinador.
create table public.firmas_bienestar (
  id uuid primary key default gen_random_uuid(),
  reunion_id uuid not null references public.reuniones_bienestar (id) on delete cascade,
  firmante_nombre text not null,
  ip text not null,
  fecha_hora timestamptz not null default now()
);

create index reuniones_bienestar_alumno_idx on public.reuniones_bienestar (alumno_id);
create index reuniones_bienestar_coordinador_idx on public.reuniones_bienestar (coordinador_id);
create index firmas_bienestar_reunion_idx on public.firmas_bienestar (reunion_id);

alter table public.coordinador_nivel enable row level security;
alter table public.reuniones_bienestar enable row level security;
alter table public.firmas_bienestar enable row level security;

-- Deliberadamente MÁS estrecho que las policies "cualquier staff" usadas en
-- otras tablas de asignación (psicologo_grado, tutoria_aula): ningún otro
-- rol tiene motivo para saber quién coordina bienestar en qué nivel.
create policy "coordinador y admin ven asignaciones de bienestar" on public.coordinador_nivel for select
  using (public.auth_rol() = 'administrador' or usuario_id = auth.uid());

create policy "coordinador ve sus reuniones de bienestar" on public.reuniones_bienestar for select
  using (public.auth_rol() = 'coordinador_bienestar' and coordinador_id = auth.uid());

create policy "administrador ve reuniones de bienestar" on public.reuniones_bienestar for select
  using (public.auth_rol() = 'administrador');

-- El coordinador solo puede registrar una reunión para un alumno
-- efectivamente matriculado (año activo) en el nivel que tiene asignado.
create policy "coordinador registra reunion de su nivel" on public.reuniones_bienestar for insert
  with check (
    public.auth_rol() = 'coordinador_bienestar'
    and coordinador_id = auth.uid()
    and exists (
      select 1 from public.coordinador_nivel cn
      join public.matriculas m on m.anio_academico_id = public.anio_activo_id()
      join public.grados g on g.id = m.grado_id and g.nivel_id = cn.nivel_id
      where cn.usuario_id = auth.uid()
      and m.alumno_id = reuniones_bienestar.alumno_id
    )
  );

create policy "acceso firmas de bienestar via reunion" on public.firmas_bienestar for select
  using (
    exists (
      select 1 from public.reuniones_bienestar rb
      where rb.id = reunion_id
      and (
        (public.auth_rol() = 'coordinador_bienestar' and rb.coordinador_id = auth.uid())
        or public.auth_rol() = 'administrador'
      )
    )
  );

create policy "coordinador firma su reunion de bienestar" on public.firmas_bienestar for insert
  with check (
    public.auth_rol() = 'coordinador_bienestar'
    and exists (
      select 1 from public.reuniones_bienestar rb
      where rb.id = reunion_id and rb.coordinador_id = auth.uid()
    )
  );
