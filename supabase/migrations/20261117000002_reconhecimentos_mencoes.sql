-- Menções dos reconhecimentos: uma pessoa (valor = e-mail), um setor (valor = nome do setor) ou todos (valor = 'todos').
-- Quem recebe é definido por estas linhas, não pelo texto da mensagem.

create table if not exists public.reconhecimento_mencoes (
  id uuid primary key default gen_random_uuid(),
  reconhecimento_id uuid not null references public.reconhecimentos (id) on delete cascade,
  tipo text not null check (tipo in ('pessoa', 'setor', 'todos')),
  valor text not null,
  -- Texto exibido após o @ na mensagem (ex.: "Ana Paula", "Qualidade", "todos").
  rotulo text not null
);

create index if not exists reconhecimento_mencoes_post_idx on public.reconhecimento_mencoes (reconhecimento_id);

alter table public.reconhecimento_mencoes enable row level security;

drop policy if exists "reconhecimento_mencoes: leitura autenticados" on public.reconhecimento_mencoes;
create policy "reconhecimento_mencoes: leitura autenticados"
  on public.reconhecimento_mencoes for select
  to authenticated
  using (true);

-- Só quem publicou o reconhecimento pode marcar pessoas, setores ou todos nele.
drop policy if exists "reconhecimento_mencoes: marcar" on public.reconhecimento_mencoes;
create policy "reconhecimento_mencoes: marcar"
  on public.reconhecimento_mencoes for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.reconhecimentos r
      where r.id = reconhecimento_id
        and lower(r.autor_email) = lower(auth.jwt() ->> 'email')
    )
  );

-- O destinatário agora vem das menções; a coluna de texto livre não é mais usada.
alter table public.reconhecimentos drop column if exists alvo;
