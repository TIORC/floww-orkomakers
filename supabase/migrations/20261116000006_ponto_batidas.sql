-- Batidas de ponto: cada vez que a pessoa confirma o ponto no modal "Bater ponto".
-- A hora é a do servidor (default now()); o RLS aceita só batidas da própria pessoa, com hora de agora.

create table if not exists public.ponto_batidas (
  id uuid primary key default gen_random_uuid(),
  colaborador_email text not null,
  colaborador_nome text not null default '',
  registrado_em timestamptz not null default now(),
  latitude double precision not null,
  longitude double precision not null,
  precisao double precision,
  criado_em timestamptz not null default now()
);

create index if not exists ponto_batidas_colaborador_idx
  on public.ponto_batidas (colaborador_email, registrado_em);

alter table public.ponto_batidas enable row level security;

drop policy if exists "ponto batidas: registrar a propria" on public.ponto_batidas;
create policy "ponto batidas: registrar a propria"
  on public.ponto_batidas for insert
  to authenticated
  with check (
    lower(colaborador_email) = lower(auth.jwt() ->> 'email')
    and registrado_em between now() - interval '5 minutes' and now() + interval '5 minutes'
  );

drop policy if exists "ponto batidas: ver as proprias" on public.ponto_batidas;
create policy "ponto batidas: ver as proprias"
  on public.ponto_batidas for select
  to authenticated
  using (lower(colaborador_email) = lower(auth.jwt() ->> 'email'));
