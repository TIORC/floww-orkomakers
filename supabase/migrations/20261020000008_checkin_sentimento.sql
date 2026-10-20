-- Check-in diário de sentimento (termômetro do humor).
-- Uma resposta por colaborador por dia; a pessoa pode alterar até a meia-noite (muda a linha do dia).
-- Os relatórios (/relatorios-gerais) leem todas as linhas agregadas por período.

create table if not exists public.checkin_sentimento (
  id uuid primary key default gen_random_uuid(),
  colaborador_email text not null,
  data date not null default current_date,
  emocao text not null check (emocao in ('muito_triste', 'triste', 'neutro', 'feliz', 'muito_feliz')),
  motivo text not null default '' check (char_length(motivo) <= 12000),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint checkin_sentimento_email_nao_vazio check (char_length(btrim(colaborador_email)) > 0),
  constraint checkin_sentimento_dia_unico unique (colaborador_email, data)
);

create index if not exists checkin_sentimento_data_idx on public.checkin_sentimento (data desc);

alter table public.checkin_sentimento enable row level security;

-- Cada pessoa registra e altera apenas o próprio check-in.
drop policy if exists "pessoa registra o proprio checkin" on public.checkin_sentimento;
create policy "pessoa registra o proprio checkin"
  on public.checkin_sentimento
  for insert
  to authenticated
  with check (lower(colaborador_email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "pessoa altera o proprio checkin" on public.checkin_sentimento;
create policy "pessoa altera o proprio checkin"
  on public.checkin_sentimento
  for update
  to authenticated
  using (lower(colaborador_email) = lower(auth.jwt() ->> 'email'))
  with check (lower(colaborador_email) = lower(auth.jwt() ->> 'email'));

-- Leitura para os relatórios: qualquer usuário autenticado vê as médias do período.
drop policy if exists "authenticated le checkins" on public.checkin_sentimento;
create policy "authenticated le checkins"
  on public.checkin_sentimento
  for select
  to authenticated
  using (true);

grant select, insert, update on public.checkin_sentimento to authenticated;

-- Base para as pesquisas futuras (satisfação, engajamento, desligamento...):
-- cada resposta fica ligada à pesquisa, à pessoa e ao dia, sem misturar com o check-in.
create table if not exists public.respostas_pesquisa (
  id uuid primary key default gen_random_uuid(),
  pesquisa text not null,
  colaborador_email text not null,
  resposta jsonb not null default '{}'::jsonb,
  respondido_em timestamptz not null default now(),
  constraint respostas_pesquisa_unica unique (pesquisa, colaborador_email)
);

alter table public.respostas_pesquisa enable row level security;

drop policy if exists "pessoa responde a propria pesquisa" on public.respostas_pesquisa;
create policy "pessoa responde a propria pesquisa"
  on public.respostas_pesquisa
  for insert
  to authenticated
  with check (lower(colaborador_email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "authenticated le respostas de pesquisa" on public.respostas_pesquisa;
create policy "authenticated le respostas de pesquisa"
  on public.respostas_pesquisa
  for select
  to authenticated
  using (true);

grant select, insert on public.respostas_pesquisa to authenticated;
