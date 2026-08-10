-- Actas de reunión con padres que el propio docente registra directamente,
-- sin necesidad de una incidencia ni un caso previo. Se archivan en la ficha
-- del alumno y son visibles para el psicólogo asignado y jefatura, pero NO
-- generan un caso: no aparecen en /casos ni en las estadísticas de carga por
-- psicólogo.

create table public.actas_docente_padres (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.alumnos (id),
  profesor_id uuid not null references public.usuarios (id),
  fecha date not null,
  hora time not null,
  asistentes text not null,
  detalle text not null,
  acuerdos_docente text not null,
  compromisos_padre text not null,
  created_at timestamptz not null default now()
);

create table public.firmas_acta_docente (
  id uuid primary key default gen_random_uuid(),
  acta_id uuid not null references public.actas_docente_padres (id) on delete cascade,
  firmante_tipo text not null check (firmante_tipo in ('profesor', 'padre')),
  firmante_nombre text not null,
  firma_data text not null,
  fecha_hora timestamptz not null default now()
);

create index actas_docente_padres_alumno_idx on public.actas_docente_padres (alumno_id);
create index actas_docente_padres_profesor_idx on public.actas_docente_padres (profesor_id);
create index firmas_acta_docente_acta_idx on public.firmas_acta_docente (acta_id);

alter table public.actas_docente_padres enable row level security;
alter table public.firmas_acta_docente enable row level security;

create policy "profesor ve sus actas creadas" on public.actas_docente_padres for select
  using (public.auth_rol() = 'profesor' and profesor_id = auth.uid());

create policy "profesor crea sus actas" on public.actas_docente_padres for insert
  with check (public.auth_rol() = 'profesor' and profesor_id = auth.uid());

create policy "psicologia ve actas docente de sus alumnos" on public.actas_docente_padres for select
  using (
    public.auth_rol() = 'jefe_psicologia'
    or (
      public.auth_rol() = 'psicologo'
      and exists (
        select 1 from public.matriculas m
        join public.anios_academicos a on a.id = m.anio_academico_id and a.activo
        where m.alumno_id = actas_docente_padres.alumno_id
        and m.grado_id in (select public.auth_grados())
      )
    )
  );

create policy "acceso firmas via acta docente" on public.firmas_acta_docente for select
  using (
    exists (
      select 1 from public.actas_docente_padres ap
      where ap.id = acta_id
      and (
        (public.auth_rol() = 'profesor' and ap.profesor_id = auth.uid())
        or public.auth_rol() = 'jefe_psicologia'
        or (
          public.auth_rol() = 'psicologo'
          and exists (
            select 1 from public.matriculas m
            join public.anios_academicos a on a.id = m.anio_academico_id and a.activo
            where m.alumno_id = ap.alumno_id
            and m.grado_id in (select public.auth_grados())
          )
        )
      )
    )
  );

create policy "profesor firma su acta" on public.firmas_acta_docente for insert
  with check (
    public.auth_rol() = 'profesor'
    and exists (
      select 1 from public.actas_docente_padres ap
      where ap.id = acta_id and ap.profesor_id = auth.uid()
    )
  );
