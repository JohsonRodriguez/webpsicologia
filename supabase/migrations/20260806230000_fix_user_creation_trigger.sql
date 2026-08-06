-- El trigger original solo disparaba en INSERT sobre auth.users, así que
-- cuentas de Google que ya existían de antes (creadas por otro proyecto)
-- nunca generaban su fila en public.usuarios al volver a iniciar sesión,
-- porque GoTrue solo actualiza esa fila (UPDATE), no la vuelve a insertar.
-- Ahora el mismo trigger corre también en UPDATE, de forma idempotente.

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created_or_updated
  after insert or update on auth.users
  for each row execute procedure public.handle_new_user();
