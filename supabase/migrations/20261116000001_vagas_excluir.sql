-- Exclusão de vagas: só Administradores e Desenvolvedor do Sistema (ou conta master), o mesmo critério de feriados.

grant delete on public.vagas to authenticated;

drop policy if exists "administracao exclui vagas" on public.vagas;
create policy "administracao exclui vagas"
  on public.vagas for delete to authenticated
  using (
    exists (
      select 1
      from public.colaboradores_importados c
      where lower(c.email) = lower(auth.jwt() ->> 'email')
        and (c.acesso_master or c.nivel_acesso in ('administrador', 'desenvolvedor'))
    )
  );
