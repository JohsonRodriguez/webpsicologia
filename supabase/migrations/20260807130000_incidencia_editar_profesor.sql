-- Permite al docente editar su incidencia mientras el psicólogo no haya
-- abierto un caso de seguimiento a partir de ella.
create policy "profesor edita su incidencia antes del caso" on public.incidencias for update
  using (
    public.auth_rol() = 'profesor'
    and profesor_id = auth.uid()
    and not exists (select 1 from public.casos c where c.incidencia_id = incidencias.id)
  )
  with check (
    public.auth_rol() = 'profesor'
    and profesor_id = auth.uid()
  );
