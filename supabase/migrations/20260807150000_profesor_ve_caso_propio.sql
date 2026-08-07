-- Bug: la policy de UPDATE del docente sobre incidencias (y el chequeo en la
-- server action) usan "existe un caso para esta incidencia" con el cliente
-- del propio docente, pero el docente no tenía ninguna policy de SELECT
-- sobre casos, así que esa comprobación siempre veía cero filas (RLS las
-- ocultaba) y dejaba editar incidencias que el psicólogo ya había tomado.
create policy "profesor ve el caso de su incidencia" on public.casos for select
  using (
    public.auth_rol() = 'profesor'
    and exists (
      select 1 from public.incidencias i
      where i.id = casos.incidencia_id and i.profesor_id = auth.uid()
    )
  );
