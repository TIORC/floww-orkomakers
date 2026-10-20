-- Vagas abertas: o processo seletivo só pode ser aberto para um cargo com vaga ativa no setor.
-- O setor é gravado pelo nome (mesmo texto de public.setores.nome e public.cargos.setor).

create table if not exists public.vagas (
  id uuid primary key default gen_random_uuid(),
  cargo_id uuid not null references public.cargos (id) on delete restrict,
  setor text not null,
  titulo text not null,
  status text not null default 'ativa' check (status in ('ativa', 'encerrada', 'cancelada')),
  criado_por uuid references auth.users (id) on delete set null default auth.uid(),
  criado_em timestamptz not null default now(),
  constraint vagas_titulo_nao_vazio check (char_length(btrim(titulo)) > 0)
);

create index if not exists vagas_cargo_id_idx on public.vagas (cargo_id);
create index if not exists vagas_setor_status_idx on public.vagas (setor, status);

alter table public.vagas enable row level security;

drop policy if exists "authenticated can read vagas" on public.vagas;
create policy "authenticated can read vagas"
  on public.vagas for select to authenticated using (true);

drop policy if exists "authenticated can insert vagas" on public.vagas;
create policy "authenticated can insert vagas"
  on public.vagas for insert to authenticated with check (true);

drop policy if exists "authenticated can update vagas" on public.vagas;
create policy "authenticated can update vagas"
  on public.vagas for update to authenticated using (true) with check (true);

grant select, insert, update on public.vagas to authenticated;
