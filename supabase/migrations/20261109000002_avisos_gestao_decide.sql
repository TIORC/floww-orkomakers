-- Gestores e administradores veem todas as solicitações de avisos (não só da própria equipe) e decidem
-- sobre todas enquanto estiverem pendentes: permitir (aprovado) ou negar (recusado).
-- Mesma regra de quem pode aprovar no app: gestor, administrador, desenvolvedor ou conta master.

create or replace function public.eh_gestao_ou_administracao()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.colaboradores_importados c
    where lower(c.email) = lower(auth.jwt() ->> 'email')
      and (c.acesso_master or c.nivel_acesso in ('gestor', 'administrador', 'desenvolvedor'))
  );
$$;

-- Vê o próprio aviso e, quem é gestão ou administração, todos os avisos.
drop policy if exists "avisos: consultar" on public.avisos;
create policy "avisos: consultar"
  on public.avisos for select
  to authenticated
  using (
    lower(solicitante_email) = lower(auth.jwt() ->> 'email')
    or public.eh_gestao_ou_administracao()
  );

-- Gestão ou administração decide qualquer aviso pendente.
drop policy if exists "avisos: decidir" on public.avisos;
create policy "avisos: decidir"
  on public.avisos for update
  to authenticated
  using (
    status = 'pendente'
    and public.eh_gestao_ou_administracao()
  )
  with check (
    status in ('aprovado', 'recusado')
    and lower(decidido_por_email) = lower(auth.jwt() ->> 'email')
  );
