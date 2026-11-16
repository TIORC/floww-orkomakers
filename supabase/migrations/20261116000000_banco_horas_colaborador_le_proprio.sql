-- Banco de Horas: cada colaborador lê só as próprias horas (espelhos e dias).
-- Administrador e Desenvolvedor do Sistema continuam com acesso total (policies "rh gerencia ..." da migração anterior).
-- A ligação é pelo nome: o nome do espelho (vindo do PDF) é comparado com o nome e o nome completo do cadastro de
-- quem está logado, sem acento e sem diferença de maiúsculas, como faz o front-end (normalizarNome).

create or replace function public.normalizar_nome_banco(nome text)
returns text
language sql
immutable
set search_path = public
as $$
  select regexp_replace(
    upper(
      translate(
        coalesce(nome, ''),
        'àáâãäçéèêëíìîïñóòôõöúùûüÀÁÂÃÄÇÉÈÊËÍÌÎÏÑÓÒÔÕÖÚÙÛÜ',
        'aaaaaceeeeiiiinooooouuuuAAAAACEEEEIIIINOOOOOUUUU'
      )
    ),
    '\s+',
    ' ',
    'g'
  );
$$;

grant execute on function public.normalizar_nome_banco(text) to authenticated;

drop policy if exists "colaborador le o proprio banco de horas" on public.banco_horas_espelhos;
create policy "colaborador le o proprio banco de horas"
  on public.banco_horas_espelhos
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.colaboradores_importados c
      where lower(c.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        and public.normalizar_nome_banco(banco_horas_espelhos.colaborador_nome) in (
          public.normalizar_nome_banco(c.nome),
          public.normalizar_nome_banco(c.nome_completo)
        )
    )
  );

-- Os dias seguem o espelho: quem vê o espelho vê os dias dele (o que o RLS de espelhos já filtra).
drop policy if exists "colaborador le os dias do proprio espelho" on public.banco_horas_dias;
create policy "colaborador le os dias do proprio espelho"
  on public.banco_horas_dias
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.banco_horas_espelhos e
      where e.id = banco_horas_dias.espelho_id
    )
  );
