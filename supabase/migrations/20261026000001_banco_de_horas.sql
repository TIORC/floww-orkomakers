-- Banco de Horas: espelhos de ponto importados do PDF (um por colaborador e período) e os dias de cada um.
-- O RH edita horas, tratamento da falta e observação na tela; tudo fica salvo aqui.
-- Dado sensível de RH: só Administrador e Desenvolvedor do Sistema leem e alteram.

create or replace function public.pode_gerir_banco_de_horas()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.colaboradores_importados
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and nivel_acesso in ('administrador', 'desenvolvedor')
  );
$$;

grant execute on function public.pode_gerir_banco_de_horas() to authenticated;

create table if not exists public.banco_horas_espelhos (
  id uuid primary key default gen_random_uuid(),
  colaborador_nome text not null,
  colaborador_cargo text not null default '',
  periodo_inicio date not null,
  periodo_fim date not null,
  -- Mês de referência: o mês em que o período termina (21/09 a 20/10 é o ciclo de outubro). Sempre dia 1.
  mes_referencia date generated always as (periodo_fim - (extract(day from periodo_fim)::int - 1)) stored,
  importado_por text not null default '',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint banco_horas_espelhos_nome_nao_vazio check (char_length(btrim(colaborador_nome)) > 0),
  constraint banco_horas_espelhos_periodo_valido check (periodo_fim >= periodo_inicio),
  -- Importar de novo o mesmo colaborador e período atualiza o espelho em vez de duplicar.
  constraint banco_horas_espelhos_unico unique (colaborador_nome, periodo_inicio, periodo_fim)
);

create index if not exists banco_horas_espelhos_mes_idx on public.banco_horas_espelhos (mes_referencia desc);

create table if not exists public.banco_horas_dias (
  id uuid primary key default gen_random_uuid(),
  espelho_id uuid not null references public.banco_horas_espelhos (id) on delete cascade,
  data date not null,
  dia_semana text not null default '',
  -- Todos os horários são guardados em minutos.
  trabalhado_min integer not null default 0 check (trabalhado_min >= 0),
  horas_extras_min integer not null default 0 check (horas_extras_min >= 0),
  horas_faltas_min integer not null default 0 check (horas_faltas_min >= 0),
  tratamento text not null default '' check (char_length(tratamento) <= 2000),
  observacao text not null default '' check (char_length(observacao) <= 2000),
  atualizado_em timestamptz not null default now(),
  constraint banco_horas_dias_unico unique (espelho_id, data)
);

create or replace function public.banco_horas_atualizar_data()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists banco_horas_espelhos_atualizado on public.banco_horas_espelhos;
create trigger banco_horas_espelhos_atualizado
  before update on public.banco_horas_espelhos
  for each row execute function public.banco_horas_atualizar_data();

drop trigger if exists banco_horas_dias_atualizado on public.banco_horas_dias;
create trigger banco_horas_dias_atualizado
  before update on public.banco_horas_dias
  for each row execute function public.banco_horas_atualizar_data();

alter table public.banco_horas_espelhos enable row level security;
alter table public.banco_horas_dias enable row level security;

drop policy if exists "rh gerencia espelhos" on public.banco_horas_espelhos;
create policy "rh gerencia espelhos"
  on public.banco_horas_espelhos
  for all
  to authenticated
  using (public.pode_gerir_banco_de_horas())
  with check (public.pode_gerir_banco_de_horas());

drop policy if exists "rh gerencia dias do espelho" on public.banco_horas_dias;
create policy "rh gerencia dias do espelho"
  on public.banco_horas_dias
  for all
  to authenticated
  using (public.pode_gerir_banco_de_horas())
  with check (public.pode_gerir_banco_de_horas());

grant select, insert, update, delete on public.banco_horas_espelhos to authenticated;
grant select, insert, update, delete on public.banco_horas_dias to authenticated;
