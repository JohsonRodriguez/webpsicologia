-- La bitácora de auditoría queda visible solo para el administrador del
-- sistema, ya no para jefatura de psicología.
drop policy "jefe y administrador leen la auditoria" on public.auditoria;

create policy "solo administrador lee la auditoria" on public.auditoria for select
  using (public.auth_rol() = 'administrador');
