-- Permite al psicólogo guardar su firma una sola vez y reutilizarla en las
-- actas de reunión con padres, en vez de firmar cada vez en pantalla.
alter table public.usuarios add column firma_guardada text;

create policy "usuario actualiza su propia firma" on public.usuarios for update
  using (id = auth.uid())
  with check (id = auth.uid());
