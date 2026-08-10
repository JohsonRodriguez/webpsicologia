-- El docente que reportó la incidencia de origen de un caso ahora puede ver y
-- firmar (con su firma guardada) las actas de reunión con padres de ese caso,
-- como tercer firmante junto al psicólogo y al padre de familia.

alter table public.firmas drop constraint firmas_firmante_tipo_check;
alter table public.firmas
  add constraint firmas_firmante_tipo_check
  check (firmante_tipo = any (array['psicologo', 'padre', 'profesor']));

create policy "profesor ve actas de su caso" on public.citas_padres for select
  using (
    public.auth_rol() = 'profesor'
    and exists (
      select 1 from public.casos c
      join public.incidencias i on i.id = c.incidencia_id
      where c.id = caso_id and i.profesor_id = auth.uid()
    )
  );

create policy "profesor ve firmas de su caso" on public.firmas for select
  using (
    public.auth_rol() = 'profesor'
    and exists (
      select 1 from public.citas_padres cp
      join public.casos c on c.id = cp.caso_id
      join public.incidencias i on i.id = c.incidencia_id
      where cp.id = cita_id and i.profesor_id = auth.uid()
    )
  );

create policy "profesor firma acta de su caso" on public.firmas for insert
  with check (
    public.auth_rol() = 'profesor'
    and firmante_tipo = 'profesor'
    and exists (
      select 1 from public.citas_padres cp
      join public.casos c on c.id = cp.caso_id
      join public.incidencias i on i.id = c.incidencia_id
      where cp.id = cita_id and i.profesor_id = auth.uid()
    )
  );
