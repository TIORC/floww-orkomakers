-- Avisos de horas extras, ausências e retrabalhos, com o fluxo de aprovação.
-- O aviso vai para o gestor direto do solicitante; sem gestor, vai para o RH e os administradores.

create table if not exists public.avisos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('hora_extra', 'ausencia', 'retrabalho')),
  solicitante_email text not null,
  solicitante_nome text not null default '',
  setor text not null default '',
  -- Gestor direto no momento do envio. Vazio quando não há gestor (vai para RH e administradores).
  gestor_email text,
  -- Campos do formulário, do jeito que foram preenchidos.
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'recusado')),
  motivo_recusa text not null default '',
  decidido_por_email text,
  decidido_por_nome text not null default '',
  decidido_em timestamptz,
  criado_em timestamptz not null default now(),
  constraint avisos_recusa_com_motivo check (status <> 'recusado' or motivo_recusa <> ''),
  constraint avisos_decisao_completa check (status = 'pendente' or decidido_por_email is not null)
);

create index if not exists avisos_solicitante_idx on public.avisos (solicitante_email);
create index if not exists avisos_gestor_idx on public.avisos (gestor_email);

alter table public.avisos enable row level security;

-- Quem é do RH ou administração (sem gestor cadastrado, o aviso cai aqui).
create or replace function public.eh_rh_ou_administracao()
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
      and (c.acesso_master or c.nivel_acesso in ('administrador', 'desenvolvedor'))
  );
$$;

drop policy if exists "avisos: enviar" on public.avisos;
create policy "avisos: enviar"
  on public.avisos for insert
  to authenticated
  with check (
    lower(solicitante_email) = lower(auth.jwt() ->> 'email')
    and status = 'pendente'
    and decidido_por_email is null
  );

-- Vê o próprio aviso, os avisos da sua equipe (quem tem você como gestor) e, sem gestor, o RH/administração.
drop policy if exists "avisos: consultar" on public.avisos;
create policy "avisos: consultar"
  on public.avisos for select
  to authenticated
  using (
    lower(solicitante_email) = lower(auth.jwt() ->> 'email')
    or lower(gestor_email) = lower(auth.jwt() ->> 'email')
    or (gestor_email is null and public.eh_rh_ou_administracao())
  );

-- Só o gestor do aviso (ou o RH, quando não há gestor) decide, e só enquanto estiver pendente.
drop policy if exists "avisos: decidir" on public.avisos;
create policy "avisos: decidir"
  on public.avisos for update
  to authenticated
  using (
    status = 'pendente'
    and (
      lower(gestor_email) = lower(auth.jwt() ->> 'email')
      or (gestor_email is null and public.eh_rh_ou_administracao())
    )
  )
  with check (
    status in ('aprovado', 'recusado')
    and lower(decidido_por_email) = lower(auth.jwt() ->> 'email')
  );
