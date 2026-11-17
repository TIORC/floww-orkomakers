-- Reconhecimentos (menu Clima e Engajamento): publicações "celebre com alguém", com curtidas e comentários.
-- Qualquer usuário autenticado lê o feed. Cada pessoa publica, curte e comenta só em seu próprio nome (pelo e-mail do login).

create table if not exists public.reconhecimentos (
  id uuid primary key default gen_random_uuid(),
  autor_email text not null,
  autor_nome text not null default '',
  autor_foto text,
  -- Destinatário citado com @ na mensagem (ex.: "todos", "NomeDoColega"). Null quando não citou ninguém.
  alvo text,
  mensagem text not null check (length(btrim(mensagem)) > 0),
  criado_em timestamptz not null default now()
);

create index if not exists reconhecimentos_criado_em_idx on public.reconhecimentos (criado_em desc);
create index if not exists reconhecimentos_autor_idx on public.reconhecimentos (autor_email);

create table if not exists public.reconhecimento_curtidas (
  reconhecimento_id uuid not null references public.reconhecimentos (id) on delete cascade,
  colaborador_email text not null,
  criado_em timestamptz not null default now(),
  primary key (reconhecimento_id, colaborador_email)
);

create table if not exists public.reconhecimento_comentarios (
  id uuid primary key default gen_random_uuid(),
  reconhecimento_id uuid not null references public.reconhecimentos (id) on delete cascade,
  autor_email text not null,
  autor_nome text not null default '',
  texto text not null check (length(btrim(texto)) > 0),
  criado_em timestamptz not null default now()
);

create index if not exists reconhecimento_comentarios_post_idx on public.reconhecimento_comentarios (reconhecimento_id);

alter table public.reconhecimentos enable row level security;
alter table public.reconhecimento_curtidas enable row level security;
alter table public.reconhecimento_comentarios enable row level security;

-- Feed: todos os autenticados leem.
drop policy if exists "reconhecimentos: leitura autenticados" on public.reconhecimentos;
create policy "reconhecimentos: leitura autenticados"
  on public.reconhecimentos for select
  to authenticated
  using (true);

drop policy if exists "reconhecimentos: publicar" on public.reconhecimentos;
create policy "reconhecimentos: publicar"
  on public.reconhecimentos for insert
  to authenticated
  with check (lower(autor_email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "reconhecimento_curtidas: leitura autenticados" on public.reconhecimento_curtidas;
create policy "reconhecimento_curtidas: leitura autenticados"
  on public.reconhecimento_curtidas for select
  to authenticated
  using (true);

drop policy if exists "reconhecimento_curtidas: curtir" on public.reconhecimento_curtidas;
create policy "reconhecimento_curtidas: curtir"
  on public.reconhecimento_curtidas for insert
  to authenticated
  with check (lower(colaborador_email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "reconhecimento_curtidas: descurtir" on public.reconhecimento_curtidas;
create policy "reconhecimento_curtidas: descurtir"
  on public.reconhecimento_curtidas for delete
  to authenticated
  using (lower(colaborador_email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "reconhecimento_comentarios: leitura autenticados" on public.reconhecimento_comentarios;
create policy "reconhecimento_comentarios: leitura autenticados"
  on public.reconhecimento_comentarios for select
  to authenticated
  using (true);

drop policy if exists "reconhecimento_comentarios: comentar" on public.reconhecimento_comentarios;
create policy "reconhecimento_comentarios: comentar"
  on public.reconhecimento_comentarios for insert
  to authenticated
  with check (lower(autor_email) = lower(auth.jwt() ->> 'email'));
