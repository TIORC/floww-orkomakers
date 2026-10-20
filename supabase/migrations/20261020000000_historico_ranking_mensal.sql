-- Histórico do ranking de gamificação: top 3 de cada mês, gravado quando o mês é finalizado.
-- A leitura é liberada para usuários autenticados; a gravação acontece no fechamento do mês.

create table if not exists public.historico_ranking_mensal (
  id uuid primary key default gen_random_uuid(),
  ano integer not null check (ano between 2000 and 2100),
  mes integer not null check (mes between 1 and 12),
  posicao integer not null check (posicao between 1 and 3),
  colaborador_id uuid references public.colaboradores_importados (id) on delete set null,
  nome text not null,
  setor text not null default '',
  foto_url text,
  pontos integer not null default 0,
  meta integer not null default 5000,
  criado_em timestamptz not null default now(),
  unique (ano, mes, posicao)
);

create index if not exists historico_ranking_mensal_periodo_idx
  on public.historico_ranking_mensal (ano desc, mes desc, posicao asc);

alter table public.historico_ranking_mensal enable row level security;

drop policy if exists "authenticated can read historico_ranking_mensal" on public.historico_ranking_mensal;
create policy "authenticated can read historico_ranking_mensal"
  on public.historico_ranking_mensal
  for select
  to authenticated
  using (true);

grant select on public.historico_ranking_mensal to authenticated;
