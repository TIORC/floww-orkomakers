-- Histórico de pontos: solicitações do próprio colaborador para incluir um horário (ponto) ou justificar uma falta.
-- Nasce sempre como pendente. A aprovação pelo RH/gestor ainda não está ligada aqui.

create table if not exists public.ponto_solicitacoes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('ponto', 'falta_justificada')),
  solicitante_email text not null,
  solicitante_nome text not null default '',
  data date not null,
  -- Horários do ponto solicitado (só quando tipo = 'ponto'). Podem cruzar a meia-noite (entrada 13:05, saída 00:06).
  entrada time,
  saida time,
  motivo text not null default '',
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'recusado')),
  criado_em timestamptz not null default now(),
  constraint ponto_solicitacoes_ponto_com_horarios
    check (tipo <> 'ponto' or (entrada is not null and saida is not null)),
  constraint ponto_solicitacoes_falta_com_motivo
    check (tipo <> 'falta_justificada' or motivo <> '')
);

create index if not exists ponto_solicitacoes_solicitante_idx
  on public.ponto_solicitacoes (solicitante_email, data);

alter table public.ponto_solicitacoes enable row level security;

-- Cada pessoa envia e vê só as próprias solicitações, e sempre entra como pendente.
drop policy if exists "ponto: enviar a propria solicitacao" on public.ponto_solicitacoes;
create policy "ponto: enviar a propria solicitacao"
  on public.ponto_solicitacoes for insert
  to authenticated
  with check (
    lower(solicitante_email) = lower(auth.jwt() ->> 'email')
    and status = 'pendente'
  );

drop policy if exists "ponto: ver as proprias solicitacoes" on public.ponto_solicitacoes;
create policy "ponto: ver as proprias solicitacoes"
  on public.ponto_solicitacoes for select
  to authenticated
  using (lower(solicitante_email) = lower(auth.jwt() ->> 'email'));
