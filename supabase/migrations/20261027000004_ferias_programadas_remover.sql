-- Remover uma programação de férias. Mesma regra de quem pode programar: gestão ou conta master.

drop policy if exists "ferias programadas: remover" on public.ferias_programadas;
create policy "ferias programadas: remover"
  on public.ferias_programadas for delete
  to authenticated
  using (
    exists (
      select 1
      from public.colaboradores_importados c
      where lower(c.email) = lower(auth.jwt() ->> 'email')
        and (c.acesso_master or c.nivel_acesso in ('gestor', 'administrador', 'desenvolvedor'))
    )
  );
