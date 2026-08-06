-- Plataforma de psicología escolar — Colegio Lord Byron
-- Esquema inicial: estructura académica, usuarios, incidencias, casos, citas, firmas, notificaciones.

-- ============================================================================
-- 1. ESTRUCTURA ACADÉMICA Y USUARIOS
-- ============================================================================

create table public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  email text not null unique,
  rol text check (rol in ('profesor', 'psicologo', 'jefe_psicologia', 'administrador')),
  activo boolean not null default false,
  created_at timestamptz not null default now()
);
comment on table public.usuarios is 'Perfil interno de cada cuenta. rol es NULL hasta que un administrador lo asigna.';

create table public.alumnos (
  id uuid primary key default gen_random_uuid(),
  nombres text not null,
  apellidos text not null,
  codigo text not null unique,
  created_at timestamptz not null default now()
);

create table public.anios_academicos (
  id uuid primary key default gen_random_uuid(),
  anio int not null unique,
  activo boolean not null default false
);
create unique index anios_academicos_un_activo on public.anios_academicos (activo) where activo;

create table public.niveles (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  orden int not null
);

create table public.grados (
  id uuid primary key default gen_random_uuid(),
  nivel_id uuid not null references public.niveles (id) on delete cascade,
  nombre text not null,
  orden int not null,
  unique (nivel_id, nombre)
);

create table public.secciones (
  id uuid primary key default gen_random_uuid(),
  grado_id uuid not null references public.grados (id) on delete cascade,
  nombre text not null,
  unique (grado_id, nombre)
);

create table public.matriculas (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.alumnos (id) on delete cascade,
  anio_academico_id uuid not null references public.anios_academicos (id) on delete cascade,
  grado_id uuid not null references public.grados (id),
  seccion_id uuid not null references public.secciones (id),
  created_at timestamptz not null default now(),
  unique (alumno_id, anio_academico_id)
);

create table public.psicologo_grado (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  grado_id uuid not null references public.grados (id) on delete cascade,
  unique (usuario_id, grado_id)
);

create table public.catalogo_motivos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  activo boolean not null default true
);

-- ============================================================================
-- 2. INCIDENCIAS, CASOS, CITAS
-- ============================================================================

create table public.incidencias (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.alumnos (id),
  profesor_id uuid not null references public.usuarios (id),
  motivo_id uuid not null references public.catalogo_motivos (id),
  prioridad text not null check (prioridad in ('baja', 'media', 'alta')),
  descripcion text not null,
  acciones_tomadas text not null,
  involucrados text,
  fecha_hora timestamptz not null default now(),
  estado text not null default 'nueva' check (estado in ('nueva', 'en_revision', 'derivada', 'cerrada')),
  created_at timestamptz not null default now()
);

create table public.evidencias (
  id uuid primary key default gen_random_uuid(),
  incidencia_id uuid not null references public.incidencias (id) on delete cascade,
  archivo_url text not null,
  created_at timestamptz not null default now()
);

create table public.casos (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.alumnos (id),
  incidencia_id uuid references public.incidencias (id),
  psicologo_id uuid not null references public.usuarios (id),
  psicologo_original_id uuid references public.usuarios (id),
  tipo text not null check (tipo in ('caso_1', 'caso_2')),
  estado text not null default 'abierto' check (estado in ('abierto', 'en_atencion', 'derivado', 'cerrado')),
  fecha_apertura date not null default current_date,
  fecha_cierre date,
  created_at timestamptz not null default now()
);

create table public.notas_seguimiento (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid not null references public.casos (id) on delete cascade,
  autor_id uuid not null references public.usuarios (id),
  fecha timestamptz not null default now(),
  contenido text not null
);

create table public.citas_padres (
  id uuid primary key default gen_random_uuid(),
  caso_id uuid not null references public.casos (id) on delete cascade,
  psicologo_id uuid not null references public.usuarios (id),
  fecha date not null,
  hora time not null,
  detalle text not null,
  asistentes text not null,
  obs_psicologo text,
  obs_padre text,
  acuerdos_psicologo text,
  compromisos_padre text,
  created_at timestamptz not null default now()
);

create table public.firmas (
  id uuid primary key default gen_random_uuid(),
  cita_id uuid not null references public.citas_padres (id) on delete cascade,
  firmante_tipo text not null check (firmante_tipo in ('psicologo', 'padre')),
  firmante_nombre text not null,
  firma_data text not null,
  fecha_hora timestamptz not null default now()
);

create table public.notificaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  tipo text not null,
  referencia_id uuid,
  leido boolean not null default false,
  fecha timestamptz not null default now(),
  texto text not null
);

create index incidencias_alumno_idx on public.incidencias (alumno_id);
create index incidencias_profesor_idx on public.incidencias (profesor_id);
create index casos_alumno_idx on public.casos (alumno_id);
create index casos_psicologo_idx on public.casos (psicologo_id);
create index notas_caso_idx on public.notas_seguimiento (caso_id);
create index citas_caso_idx on public.citas_padres (caso_id);
create index firmas_cita_idx on public.firmas (cita_id);
create index notificaciones_usuario_idx on public.notificaciones (usuario_id, leido);
create index matriculas_anio_idx on public.matriculas (anio_academico_id);

-- ============================================================================
-- 3. FUNCIONES AUXILIARES (usadas por RLS)
-- ============================================================================

create function public.auth_rol() returns text
language sql stable security definer set search_path = public as $$
  select rol from public.usuarios where id = auth.uid() and activo = true;
$$;

create function public.auth_grados() returns setof uuid
language sql stable security definer set search_path = public as $$
  select grado_id from public.psicologo_grado where usuario_id = auth.uid();
$$;

create function public.anio_activo_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.anios_academicos where activo = true limit 1;
$$;

create function public.grado_de_alumno(p_alumno_id uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select grado_id from public.matriculas
  where alumno_id = p_alumno_id and anio_academico_id = public.anio_activo_id();
$$;

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- Crea el perfil interno la primera vez que alguien inicia sesión con Google.
-- El rol queda NULL/activo=false hasta que un administrador lo asigna.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.usuarios (id, nombre, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Solo un año académico activo a la vez.
create function public.enforce_single_active_anio() returns trigger
language plpgsql as $$
begin
  if new.activo then
    update public.anios_academicos set activo = false where id <> new.id and activo = true;
  end if;
  return new;
end;
$$;

create trigger trg_single_active_anio
  after insert or update of activo on public.anios_academicos
  for each row when (new.activo) execute procedure public.enforce_single_active_anio();

-- Notificaciones automáticas (evita que la app "olvide" notificar).
create function public.notify_incidencia_creada() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_grado uuid;
  v_psicologo uuid;
  v_alumno text;
begin
  v_grado := public.grado_de_alumno(new.alumno_id);
  select usuario_id into v_psicologo from public.psicologo_grado where grado_id = v_grado limit 1;
  select nombres || ' ' || apellidos into v_alumno from public.alumnos where id = new.alumno_id;

  if v_psicologo is not null then
    insert into public.notificaciones (usuario_id, tipo, referencia_id, texto)
    values (v_psicologo, 'incidencia_asignada', new.id, 'Nueva incidencia asignada: ' || v_alumno || '.');
  end if;
  return new;
end;
$$;

create trigger trg_notify_incidencia_creada
  after insert on public.incidencias
  for each row execute procedure public.notify_incidencia_creada();

create function public.notify_incidencia_estado() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_alumno text;
begin
  if new.estado is distinct from old.estado and new.estado in ('derivada', 'cerrada') then
    select nombres || ' ' || apellidos into v_alumno from public.alumnos where id = new.alumno_id;
    insert into public.notificaciones (usuario_id, tipo, referencia_id, texto)
    values (
      new.profesor_id,
      case when new.estado = 'cerrada' then 'incidencia_cerrada' else 'incidencia_derivada' end,
      new.id,
      'Tu incidencia sobre ' || v_alumno || case when new.estado = 'cerrada' then ' fue cerrada por el psicólogo.' else ' fue derivada a un caso de seguimiento.' end
    );
  end if;
  return new;
end;
$$;

create trigger trg_notify_incidencia_estado
  after update on public.incidencias
  for each row execute procedure public.notify_incidencia_estado();

create function public.notify_caso_derivado() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_alumno text;
begin
  if new.psicologo_id is distinct from old.psicologo_id then
    select nombres || ' ' || apellidos into v_alumno from public.alumnos where id = new.alumno_id;
    insert into public.notificaciones (usuario_id, tipo, referencia_id, texto)
    values (new.psicologo_id, 'caso_derivado', new.id, 'Se te derivó el caso de ' || v_alumno || '.');
  end if;
  return new;
end;
$$;

create trigger trg_notify_caso_derivado
  after update on public.casos
  for each row execute procedure public.notify_caso_derivado();

-- Al cerrar un caso originado por una incidencia, cierra también la incidencia.
create function public.close_incidencia_on_caso_close() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.estado = 'cerrado' and old.estado is distinct from 'cerrado' and new.incidencia_id is not null then
    update public.incidencias set estado = 'cerrada' where id = new.incidencia_id and estado <> 'cerrada';
  end if;
  return new;
end;
$$;

create trigger trg_close_incidencia_on_caso_close
  after update on public.casos
  for each row execute procedure public.close_incidencia_on_caso_close();

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

alter table public.usuarios enable row level security;
alter table public.alumnos enable row level security;
alter table public.anios_academicos enable row level security;
alter table public.niveles enable row level security;
alter table public.grados enable row level security;
alter table public.secciones enable row level security;
alter table public.matriculas enable row level security;
alter table public.psicologo_grado enable row level security;
alter table public.catalogo_motivos enable row level security;
alter table public.incidencias enable row level security;
alter table public.evidencias enable row level security;
alter table public.casos enable row level security;
alter table public.notas_seguimiento enable row level security;
alter table public.citas_padres enable row level security;
alter table public.firmas enable row level security;
alter table public.notificaciones enable row level security;

-- --- Catálogos / estructura académica: lectura abierta a cualquier cuenta activa,
-- --- escritura solo vía API de administrador (service_role, sin RLS).
create policy "lectura staff activo" on public.usuarios for select using (public.auth_rol() is not null);
create policy "lectura staff activo" on public.alumnos for select using (public.auth_rol() is not null);
create policy "lectura staff activo" on public.anios_academicos for select using (public.auth_rol() is not null);
create policy "lectura staff activo" on public.niveles for select using (public.auth_rol() is not null);
create policy "lectura staff activo" on public.grados for select using (public.auth_rol() is not null);
create policy "lectura staff activo" on public.secciones for select using (public.auth_rol() is not null);
create policy "lectura staff activo" on public.matriculas for select using (public.auth_rol() is not null);
create policy "lectura staff activo" on public.psicologo_grado for select using (public.auth_rol() is not null);
create policy "lectura staff activo" on public.catalogo_motivos for select using (public.auth_rol() is not null);

-- --- INCIDENCIAS ---
create policy "profesor ve sus incidencias" on public.incidencias for select
  using (public.auth_rol() = 'profesor' and profesor_id = auth.uid());

create policy "psicologo ve incidencias de su grado" on public.incidencias for select
  using (public.auth_rol() = 'psicologo' and public.grado_de_alumno(alumno_id) in (select public.auth_grados()));

create policy "jefe ve todas las incidencias" on public.incidencias for select
  using (public.auth_rol() = 'jefe_psicologia');

create policy "profesor crea incidencia" on public.incidencias for insert
  with check (public.auth_rol() = 'profesor' and profesor_id = auth.uid());
-- Sin policy de update/delete para profesor: la incidencia queda fija tras enviarse.

create policy "psicologo actualiza incidencias de su grado" on public.incidencias for update
  using (public.auth_rol() = 'psicologo' and public.grado_de_alumno(alumno_id) in (select public.auth_grados()))
  with check (public.auth_rol() = 'psicologo' and public.grado_de_alumno(alumno_id) in (select public.auth_grados()));

create policy "jefe actualiza cualquier incidencia" on public.incidencias for update
  using (public.auth_rol() = 'jefe_psicologia') with check (public.auth_rol() = 'jefe_psicologia');

-- --- EVIDENCIAS (heredan visibilidad de la incidencia) ---
create policy "acceso evidencias via incidencia" on public.evidencias for select
  using (exists (select 1 from public.incidencias i where i.id = incidencia_id));

create policy "profesor adjunta evidencia a su incidencia" on public.evidencias for insert
  with check (exists (
    select 1 from public.incidencias i
    where i.id = incidencia_id and i.profesor_id = auth.uid()
  ));

-- --- CASOS ---
create policy "psicologo ve sus casos" on public.casos for select
  using (public.auth_rol() = 'psicologo' and psicologo_id = auth.uid());

create policy "jefe ve todos los casos" on public.casos for select
  using (public.auth_rol() = 'jefe_psicologia');

create policy "psicologo abre caso" on public.casos for insert
  with check (public.auth_rol() in ('psicologo', 'jefe_psicologia') and psicologo_id = auth.uid());

create policy "psicologo actualiza su caso" on public.casos for update
  using (public.auth_rol() = 'psicologo' and psicologo_id = auth.uid())
  with check (public.auth_rol() = 'psicologo' and psicologo_id = auth.uid());

create policy "jefe actualiza y deriva cualquier caso" on public.casos for update
  using (public.auth_rol() = 'jefe_psicologia') with check (public.auth_rol() = 'jefe_psicologia');

-- --- NOTAS DE SEGUIMIENTO ---
create policy "acceso a notas via caso" on public.notas_seguimiento for select
  using (exists (
    select 1 from public.casos c
    where c.id = caso_id and (c.psicologo_id = auth.uid() or public.auth_rol() = 'jefe_psicologia')
  ));

create policy "agregar nota a caso propio" on public.notas_seguimiento for insert
  with check (
    autor_id = auth.uid()
    and exists (
      select 1 from public.casos c
      where c.id = caso_id and (c.psicologo_id = auth.uid() or public.auth_rol() = 'jefe_psicologia')
    )
  );

-- --- CITAS_PADRES / FIRMAS (heredan visibilidad del caso) ---
create policy "acceso citas via caso" on public.citas_padres for select
  using (exists (
    select 1 from public.casos c
    where c.id = caso_id and (c.psicologo_id = auth.uid() or public.auth_rol() = 'jefe_psicologia')
  ));

create policy "registrar cita de caso propio" on public.citas_padres for insert
  with check (
    psicologo_id = auth.uid()
    and exists (
      select 1 from public.casos c
      where c.id = caso_id and (c.psicologo_id = auth.uid() or public.auth_rol() = 'jefe_psicologia')
    )
  );

create policy "acceso firmas via cita" on public.firmas for select
  using (exists (
    select 1 from public.citas_padres cp
    join public.casos c on c.id = cp.caso_id
    where cp.id = cita_id and (c.psicologo_id = auth.uid() or public.auth_rol() = 'jefe_psicologia')
  ));

create policy "registrar firma de cita propia" on public.firmas for insert
  with check (exists (
    select 1 from public.citas_padres cp
    join public.casos c on c.id = cp.caso_id
    where cp.id = cita_id and (c.psicologo_id = auth.uid() or public.auth_rol() = 'jefe_psicologia')
  ));

-- --- NOTIFICACIONES (solo lectura/marcado propio; la escritura la hacen los triggers) ---
create policy "cada quien ve solo sus notificaciones" on public.notificaciones for select
  using (usuario_id = auth.uid());

create policy "marcar como leida" on public.notificaciones for update
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- ============================================================================
-- 6. DATOS SEMILLA MÍNIMOS (niveles/grados/secciones/año activo/catálogo)
-- ============================================================================

insert into public.niveles (nombre, orden) values ('Inicial', 1), ('Primaria', 2), ('Secundaria', 3);

insert into public.grados (nivel_id, nombre, orden)
select n.id, g.nombre, g.orden
from public.niveles n
join lateral (
  values
    ('3 años', 1), ('4 años', 2), ('5 años', 3)
) as g(nombre, orden) on n.nombre = 'Inicial'
union all
select n.id, g.nombre, g.orden
from public.niveles n
join lateral (
  values ('1°', 1), ('2°', 2), ('3°', 3), ('4°', 4), ('5°', 5), ('6°', 6)
) as g(nombre, orden) on n.nombre = 'Primaria'
union all
select n.id, g.nombre, g.orden
from public.niveles n
join lateral (
  values ('1°', 1), ('2°', 2), ('3°', 3), ('4°', 4), ('5°', 5)
) as g(nombre, orden) on n.nombre = 'Secundaria';

insert into public.secciones (grado_id, nombre)
select g.id, s.nombre from public.grados g join lateral (values ('A'), ('B')) as s(nombre) on true;

insert into public.anios_academicos (anio, activo) values (2026, true);

insert into public.catalogo_motivos (nombre) values
  ('Conducta disruptiva en aula'),
  ('Conflicto entre compañeros'),
  ('Bajo rendimiento académico'),
  ('Ausentismo reiterado'),
  ('Señales de ansiedad o tristeza'),
  ('Uso inadecuado de dispositivos'),
  ('Agresión física'),
  ('Agresión verbal'),
  ('Dificultad de adaptación'),
  ('Otro');
