-- Férias programadas pelo gestor ou administrador. Programar não efetiva as férias.
-- Só quem tem papel de gestão (ou é o Desenvolvedor / conta master) consegue inserir.

create table if not exists public.ferias_programadas (
  id uuid primary key default gen_random_uuid(),
  colaborador_email text not null,
  colaborador_nome text not null default '',
  inicio date not null,
  fim date not null,
  programado_por_email text not null,
  criado_em timestamptz not null default now(),
  constraint ferias_programadas_periodo_valido check (fim >= inicio)
);

create index if not exists ferias_programadas_colaborador_idx
  on public.ferias_programadas (colaborador_email);

alter table public.ferias_programadas enable row level security;

drop policy if exists "ferias programadas: leitura" on public.ferias_programadas;
create policy "ferias programadas: leitura"
  on public.ferias_programadas for select
  to authenticated
  using (true);

drop policy if exists "ferias programadas: programar" on public.ferias_programadas;
create policy "ferias programadas: programar"
  on public.ferias_programadas for insert
  to authenticated
  with check (
    lower(programado_por_email) = lower(auth.jwt() ->> 'email')
    and exists (
      select 1
      from public.colaboradores_importados c
      where lower(c.email) = lower(auth.jwt() ->> 'email')
        and (c.acesso_master or c.nivel_acesso in ('gestor', 'administrador', 'desenvolvedor'))
    )
  );
