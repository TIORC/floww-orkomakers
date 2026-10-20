-- Cargos e salários: cada cargo tem um setor e uma ou mais senioridades com a faixa salarial.
-- O setor é gravado pelo nome (mesmo texto de public.setores.nome).

create table if not exists public.cargos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cbo text not null default '',
  setor text not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint cargos_nome_nao_vazio check (char_length(btrim(nome)) > 0),
  constraint cargos_setor_nao_vazio check (char_length(btrim(setor)) > 0)
);

-- Não repete o mesmo cargo dentro do mesmo setor (sem diferenciar maiúsculas).
create unique index if not exists cargos_nome_setor_unique on public.cargos (lower(nome), setor);
create index if not exists cargos_setor_idx on public.cargos (setor);

create table if not exists public.cargo_senioridades (
  id uuid primary key default gen_random_uuid(),
  cargo_id uuid not null references public.cargos (id) on delete cascade,
  nivel text not null,
  faixa_minima numeric(12, 2) not null,
  salario_base numeric(12, 2) not null,
  faixa_maxima numeric(12, 2) not null,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  constraint senioridades_nivel_nao_vazio check (char_length(btrim(nivel)) > 0),
  constraint senioridades_faixas_validas check (
    faixa_minima > 0 and salario_base > 0 and faixa_maxima > 0
    and faixa_minima <= salario_base and salario_base <= faixa_maxima
  )
);

create index if not exists cargo_senioridades_cargo_idx on public.cargo_senioridades (cargo_id, ordem);

alter table public.cargos enable row level security;
alter table public.cargo_senioridades enable row level security;

drop policy if exists "authenticated can read cargos" on public.cargos;
create policy "authenticated can read cargos"
  on public.cargos for select to authenticated using (true);

drop policy if exists "authenticated can insert cargos" on public.cargos;
create policy "authenticated can insert cargos"
  on public.cargos for insert to authenticated with check (true);

drop policy if exists "authenticated can update cargos" on public.cargos;
create policy "authenticated can update cargos"
  on public.cargos for update to authenticated using (true) with check (true);

drop policy if exists "authenticated can delete cargos" on public.cargos;
create policy "authenticated can delete cargos"
  on public.cargos for delete to authenticated using (true);

drop policy if exists "authenticated can read cargo_senioridades" on public.cargo_senioridades;
create policy "authenticated can read cargo_senioridades"
  on public.cargo_senioridades for select to authenticated using (true);

drop policy if exists "authenticated can insert cargo_senioridades" on public.cargo_senioridades;
create policy "authenticated can insert cargo_senioridades"
  on public.cargo_senioridades for insert to authenticated with check (true);

drop policy if exists "authenticated can update cargo_senioridades" on public.cargo_senioridades;
create policy "authenticated can update cargo_senioridades"
  on public.cargo_senioridades for update to authenticated using (true) with check (true);

drop policy if exists "authenticated can delete cargo_senioridades" on public.cargo_senioridades;
create policy "authenticated can delete cargo_senioridades"
  on public.cargo_senioridades for delete to authenticated using (true);

grant select, insert, update, delete on public.cargos to authenticated;
grant select, insert, update, delete on public.cargo_senioridades to authenticated;
