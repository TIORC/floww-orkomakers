-- Só o Desenvolvedor do Sistema pode excluir as próprias solicitações de avisos (tela "Minhas Solicitações").
-- Quem não é desenvolvedor continua sem permissão para excluir.

grant delete on public.avisos to authenticated;

drop policy if exists "avisos: excluir proprio desenvolvedor" on public.avisos;
create policy "avisos: excluir proprio desenvolvedor"
  on public.avisos for delete
  to authenticated
  using (
    lower(solicitante_email) = lower(auth.jwt() ->> 'email')
    and exists (
      select 1
      from public.colaboradores_importados c
      where lower(c.email) = lower(auth.jwt() ->> 'email')
        and c.nivel_acesso = 'desenvolvedor'
    )
  );
