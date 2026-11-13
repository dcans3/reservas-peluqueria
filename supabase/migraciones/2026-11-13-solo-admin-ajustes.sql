-- 2026-11-13 · Solo los admin pueden cambiar los ajustes.
-- Todo el personal puede LEER los ajustes (los necesita la agenda), pero solo
-- el rol 'admin' puede crear, cambiar o borrar. citas y clientes no cambian.

create or replace function es_admin() returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.personal where user_id = auth.uid() and rol = 'admin'
  );
$$;

-- Quitar las políticas antiguas: dejaban escribir a todo el personal.
-- (Las políticas se suman con OR: si se quedaran, la nueva no serviría de nada.)
drop policy if exists "solo personal" on negocio;
drop policy if exists "solo personal" on servicios;
drop policy if exists "solo personal" on profesionales;
drop policy if exists "solo personal" on profesional_servicios;
drop policy if exists "solo personal" on horarios;
drop policy if exists "solo personal" on ausencias;

-- negocio
create policy "personal lee"  on negocio for select to authenticated using (es_personal());
create policy "admin crea"    on negocio for insert to authenticated with check (es_admin());
create policy "admin cambia"  on negocio for update to authenticated using (es_admin()) with check (es_admin());
create policy "admin borra"   on negocio for delete to authenticated using (es_admin());

-- servicios
create policy "personal lee"  on servicios for select to authenticated using (es_personal());
create policy "admin crea"    on servicios for insert to authenticated with check (es_admin());
create policy "admin cambia"  on servicios for update to authenticated using (es_admin()) with check (es_admin());
create policy "admin borra"   on servicios for delete to authenticated using (es_admin());

-- profesionales
create policy "personal lee"  on profesionales for select to authenticated using (es_personal());
create policy "admin crea"    on profesionales for insert to authenticated with check (es_admin());
create policy "admin cambia"  on profesionales for update to authenticated using (es_admin()) with check (es_admin());
create policy "admin borra"   on profesionales for delete to authenticated using (es_admin());

-- profesional_servicios
create policy "personal lee"  on profesional_servicios for select to authenticated using (es_personal());
create policy "admin crea"    on profesional_servicios for insert to authenticated with check (es_admin());
create policy "admin cambia"  on profesional_servicios for update to authenticated using (es_admin()) with check (es_admin());
create policy "admin borra"   on profesional_servicios for delete to authenticated using (es_admin());

-- horarios
create policy "personal lee"  on horarios for select to authenticated using (es_personal());
create policy "admin crea"    on horarios for insert to authenticated with check (es_admin());
create policy "admin cambia"  on horarios for update to authenticated using (es_admin()) with check (es_admin());
create policy "admin borra"   on horarios for delete to authenticated using (es_admin());

-- ausencias
create policy "personal lee"  on ausencias for select to authenticated using (es_personal());
create policy "admin crea"    on ausencias for insert to authenticated with check (es_admin());
create policy "admin cambia"  on ausencias for update to authenticated using (es_admin()) with check (es_admin());
create policy "admin borra"   on ausencias for delete to authenticated using (es_admin());
