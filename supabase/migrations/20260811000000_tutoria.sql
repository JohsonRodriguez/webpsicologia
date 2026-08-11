-- Tutoría de aula: hasta 2 docentes tutores por sección, por año lectivo,
-- con historial (nunca se sobrescribe una asignación, se cierra y se abre
-- una nueva) para no perder trazabilidad si cambia a mitad de año.

create table public.tutoria_aula (
  id uuid primary key default gen_random_uuid(),
  seccion_id uuid not null references public.secciones (id) on delete cascade,
  usuario_id uuid not null references public.usuarios (id),
  anio_academico_id uuid not null references public.anios_academicos (id),
  slot smallint not null check (slot in (1, 2)),
  fecha_inicio date not null default current_date,
  fecha_fin date,
  created_at timestamptz not null default now()
);

create unique index tutoria_aula_slot_activo_unq
  on public.tutoria_aula (seccion_id, anio_academico_id, slot)
  where fecha_fin is null;

create index tutoria_aula_usuario_idx on public.tutoria_aula (usuario_id, anio_academico_id) where fecha_fin is null;

-- Actas de reunión de tutoría con padres: función aparte de las actas
-- "libres" de docente (actas_docente_padres) — solo el tutor asignado del
-- aula puede registrarlas, y solo para sus alumnos tutorados. Tampoco
-- generan un caso ni afectan la carga del psicólogo.

create table public.actas_tutoria (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.alumnos (id),
  tutor_id uuid not null references public.usuarios (id),
  fecha date not null,
  hora time not null,
  asistentes text not null,
  detalle text not null,
  acuerdos_tutor text not null,
  compromisos_padre text not null,
  created_at timestamptz not null default now()
);

create table public.firmas_tutoria (
  id uuid primary key default gen_random_uuid(),
  acta_id uuid not null references public.actas_tutoria (id) on delete cascade,
  firmante_tipo text not null check (firmante_tipo in ('tutor', 'padre')),
  firmante_nombre text not null,
  firma_data text not null,
  fecha_hora timestamptz not null default now()
);

create index actas_tutoria_alumno_idx on public.actas_tutoria (alumno_id);
create index actas_tutoria_tutor_idx on public.actas_tutoria (tutor_id);
create index firmas_tutoria_acta_idx on public.firmas_tutoria (acta_id);

alter table public.tutoria_aula enable row level security;
alter table public.actas_tutoria enable row level security;
alter table public.firmas_tutoria enable row level security;

-- Cualquier staff autenticado puede ver las asignaciones de tutoría: las
-- usa el propio tutor, el panel de administrador y el seguimiento de
-- psicología.
create policy "staff ve asignaciones de tutoria" on public.tutoria_aula for select
  using (public.auth_rol() is not null);

create policy "tutor ve sus actas de tutoria" on public.actas_tutoria for select
  using (public.auth_rol() = 'profesor' and tutor_id = auth.uid());

create policy "psicologia ve actas de tutoria de sus alumnos" on public.actas_tutoria for select
  using (
    public.auth_rol() = 'jefe_psicologia'
    or (
      public.auth_rol() = 'psicologo'
      and exists (
        select 1 from public.matriculas m
        join public.anios_academicos a on a.id = m.anio_academico_id and a.activo
        where m.alumno_id = actas_tutoria.alumno_id
        and m.grado_id in (select public.auth_grados())
      )
    )
  );

-- El tutor solo puede registrar un acta para un alumno que esté matriculado
-- (año activo) en una sección donde él es tutor activo ahora mismo.
create policy "tutor registra acta de su aula" on public.actas_tutoria for insert
  with check (
    public.auth_rol() = 'profesor'
    and tutor_id = auth.uid()
    and exists (
      select 1 from public.tutoria_aula ta
      join public.matriculas m on m.seccion_id = ta.seccion_id and m.anio_academico_id = ta.anio_academico_id
      where ta.usuario_id = auth.uid()
      and ta.fecha_fin is null
      and ta.anio_academico_id = public.anio_activo_id()
      and m.alumno_id = actas_tutoria.alumno_id
    )
  );

create policy "acceso firmas via acta de tutoria" on public.firmas_tutoria for select
  using (
    exists (
      select 1 from public.actas_tutoria at
      where at.id = acta_id
      and (
        (public.auth_rol() = 'profesor' and at.tutor_id = auth.uid())
        or public.auth_rol() = 'jefe_psicologia'
        or (
          public.auth_rol() = 'psicologo'
          and exists (
            select 1 from public.matriculas m
            join public.anios_academicos a on a.id = m.anio_academico_id and a.activo
            where m.alumno_id = at.alumno_id
            and m.grado_id in (select public.auth_grados())
          )
        )
      )
    )
  );

create policy "tutor firma su acta de tutoria" on public.firmas_tutoria for insert
  with check (
    public.auth_rol() = 'profesor'
    and exists (
      select 1 from public.actas_tutoria at
      where at.id = acta_id and at.tutor_id = auth.uid()
    )
  );

-- Gap real: hoy un profesor solo ve las incidencias que él mismo reportó.
-- Un tutor necesita ver todas las incidencias de sus alumnos tutorados,
-- las haya reportado quien las haya reportado. Policy adicional: las SELECT
-- permisivas se combinan con OR, no reemplaza "profesor ve sus incidencias".
create policy "tutor ve incidencias de su aula" on public.incidencias for select
  using (
    public.auth_rol() = 'profesor'
    and exists (
      select 1 from public.tutoria_aula ta
      join public.matriculas m on m.seccion_id = ta.seccion_id and m.anio_academico_id = ta.anio_academico_id
      where ta.usuario_id = auth.uid()
      and ta.fecha_fin is null
      and ta.anio_academico_id = public.anio_activo_id()
      and m.alumno_id = incidencias.alumno_id
    )
  );
