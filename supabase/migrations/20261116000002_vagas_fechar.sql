-- Fechar vaga (status 'encerrada'): só Administradores e Desenvolvedor do Sistema (ou conta master).
-- Substitui a política antiga, que deixava qualquer usuário autenticado alterar qualquer vaga.

drop policy if exists "authenticated can update vagas" on public.vagas;

drop policy if exists "administracao atualiza vagas" on public.vagas;
create policy "administracao atualiza vagas"
  on public.vagas for update to authenticated
  using (
    exists (
      select 1
      from public.colaboradores_importados c
      where lower(c.email) = lower(auth.jwt() ->> 'email')
        and (c.acesso_master or c.nivel_acesso in ('administrador', 'desenvolvedor'))
    )
  )
  with check (
    exists (
      select 1
      from public.colaboradores_importados c
      where lower(c.email) = lower(auth.jwt() ->> 'email')
        and (c.acesso_master or c.nivel_acesso in ('administrador', 'desenvolvedor'))
    )
  );
