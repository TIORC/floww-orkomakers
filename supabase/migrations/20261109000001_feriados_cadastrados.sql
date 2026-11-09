-- Feriados cadastrados pelo RH (Departamento Pessoal): recorrentes (todo ano na mesma data),
-- de datas avulsas, federais, estaduais, municipais e internos da empresa.
-- Os feriados nacionais calculados automaticamente (inclusive os móveis e o 2 de Julho) continuam no código.

create table if not exists public.feriados_cadastrados (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  -- Para recorrentes, só o dia e o mês importam (o ano guardado é apenas referência).
  data date not null,
  recorrente boolean not null default false,
  tipo text not null check (tipo in ('federal', 'estadual', 'municipal', 'interno')),
  abrangencia text not null default '',
  criado_por_email text not null default '',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.feriados_cadastrados enable row level security;

drop policy if exists "feriados cadastrados: leitura" on public.feriados_cadastrados;
create policy "feriados cadastrados: leitura"
  on public.feriados_cadastrados for select
  to authenticated
  using (true);

-- Gravar, alterar e remover: só RH (administradores) e o Desenvolvedor do Sistema / conta master.
drop policy if exists "feriados cadastrados: gravar" on public.feriados_cadastrados;
create policy "feriados cadastrados: gravar"
  on public.feriados_cadastrados for all
  to authenticated
  using (
    exists (
      select 1
      from public.colaboradores_importados c
      where lower(c.email) = lower(auth.jwt() ->> 'email')
        and (c.acesso_master or c.nivel_acesso in ('administrador', 'desenvolvedor'))
    )
  )
  with check (
    exists (
      select 1
      from public.colaboradores_importados c
      where lower(c.email) = lower(auth.jwt() ->> 'email')
        and (c.acesso_master or c.nivel_acesso in ('administrador', 'desenvolvedor'))
    )
  );
