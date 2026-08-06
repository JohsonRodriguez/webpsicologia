-- Corrige RLS de evidencias: la policy anterior solo comprobaba que la incidencia
-- existiera, no que el usuario tuviera derecho a verla. Y agrega el bucket de storage.

drop policy "acceso evidencias via incidencia" on public.evidencias;

create policy "acceso evidencias via incidencia" on public.evidencias for select
  using (exists (
    select 1 from public.incidencias i
    where i.id = incidencia_id
      and (
        (public.auth_rol() = 'profesor' and i.profesor_id = auth.uid())
        or (public.auth_rol() = 'psicologo' and public.grado_de_alumno(i.alumno_id) in (select public.auth_grados()))
        or public.auth_rol() = 'jefe_psicologia'
      )
  ));

insert into storage.buckets (id, name, public)
values ('evidencias', 'evidencias', false)
on conflict (id) do nothing;

create policy "subir evidencia propia" on storage.objects for insert
  with check (bucket_id = 'evidencias' and public.auth_rol() = 'profesor');

create policy "leer evidencia autorizada" on storage.objects for select
  using (
    bucket_id = 'evidencias'
    and exists (
      select 1 from public.evidencias e
      join public.incidencias i on i.id = e.incidencia_id
      where e.archivo_url = storage.objects.name
        and (
          (public.auth_rol() = 'profesor' and i.profesor_id = auth.uid())
          or (public.auth_rol() = 'psicologo' and public.grado_de_alumno(i.alumno_id) in (select public.auth_grados()))
          or public.auth_rol() = 'jefe_psicologia'
        )
    )
  );
