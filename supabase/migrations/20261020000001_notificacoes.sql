-- Notificações do sistema. Cada linha pertence a um destinatário (pelo e-mail da conta).
-- Quem gera a notificação é a funcionalidade que a dispara (moedas, feedback, pesquisa, curso...).

create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  destinatario_email text not null,
  tipo text not null default 'geral',
  texto text not null,
  ator_nome text not null default '',
  ator_foto_url text,
  lida boolean not null default false,
  criada_em timestamptz not null default now()
);

create index if not exists notificacoes_destinatario_idx
  on public.notificacoes (destinatario_email, criada_em desc);

alter table public.notificacoes enable row level security;

-- Cada pessoa lê e marca como lidas apenas as próprias notificações.
drop policy if exists "destinatario le as proprias notificacoes" on public.notificacoes;
create policy "destinatario le as proprias notificacoes"
  on public.notificacoes
  for select
  to authenticated
  using (lower(destinatario_email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "destinatario marca as proprias notificacoes" on public.notificacoes;
create policy "destinatario marca as proprias notificacoes"
  on public.notificacoes
  for update
  to authenticated
  using (lower(destinatario_email) = lower(auth.jwt() ->> 'email'))
  with check (lower(destinatario_email) = lower(auth.jwt() ->> 'email'));

-- Inserção pelo app (funcionalidades que disparam notificações).
drop policy if exists "authenticated pode criar notificacoes" on public.notificacoes;
create policy "authenticated pode criar notificacoes"
  on public.notificacoes
  for insert
  to authenticated
  with check (true);

grant select, insert, update on public.notificacoes to authenticated;
