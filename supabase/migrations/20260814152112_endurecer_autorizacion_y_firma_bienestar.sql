-- Permite que la jefatura abra una incidencia y la asigne al psicólogo
-- configurado para el grado. Un psicólogo regular sigue pudiendo crear
-- únicamente casos asignados a sí mismo.
drop policy "psicologo abre caso" on public.casos;

create policy "psicologo abre caso propio" on public.casos for insert
  to authenticated
  with check (
    public.auth_rol() = 'psicologo'
    and psicologo_id = (select auth.uid())
  );

create policy "jefe abre cualquier caso" on public.casos for insert
  to authenticated
  with check (public.auth_rol() = 'jefe_psicologia');

-- Consume el enlace público y registra observación + firma en una sola
-- transacción. La función se invoca con el cliente service_role del servidor,
-- pero no es SECURITY DEFINER ni puede ejecutarla un cliente anon/autenticado.
create or replace function public.registrar_observacion_padre_bienestar(
  p_token uuid,
  p_observacion_padre text,
  p_firma_data text,
  p_firmante_nombre text,
  p_ip text
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_reunion_id uuid;
begin
  if length(trim(p_observacion_padre)) = 0 or length(p_observacion_padre) > 4000 then
    raise exception using errcode = '22023', message = 'observacion_invalida';
  end if;

  if length(trim(p_firmante_nombre)) = 0 or length(p_firmante_nombre) > 160 then
    raise exception using errcode = '22023', message = 'firmante_invalido';
  end if;

  if p_firma_data not like 'data:image/%' or octet_length(p_firma_data) > 2097152 then
    raise exception using errcode = '22023', message = 'firma_invalida';
  end if;

  update public.reuniones_bienestar
  set observacion_padre = trim(p_observacion_padre), token = null
  where token = p_token and observacion_padre is null
  returning id into v_reunion_id;

  if v_reunion_id is null then
    raise exception using errcode = 'P0001', message = 'enlace_no_disponible';
  end if;

  insert into public.firmas_bienestar (
    reunion_id,
    firmante_nombre,
    firma_data,
    ip
  ) values (
    v_reunion_id,
    trim(p_firmante_nombre),
    p_firma_data,
    p_ip
  );

  return v_reunion_id;
end;
$$;

revoke all on function public.registrar_observacion_padre_bienestar(uuid, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.registrar_observacion_padre_bienestar(uuid, text, text, text, text)
  to service_role;
