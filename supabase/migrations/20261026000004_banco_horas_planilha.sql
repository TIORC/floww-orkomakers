-- Banco de Horas no formato da planilha: uma linha por colaborador e período.
-- Do PDF do espelho vêm só os três totais (extras, faltas e trabalhadas); o resto o RH digita à mão.
-- Horários em minutos. Saldo anterior e horas para compensar aceitam sinal; horas a pagar/descontar só negativo.
-- O "banco de horas" não é guardado: a tela calcula saldo anterior + extras - faltas.
alter table public.banco_horas_espelhos
  add column if not exists horas_extras_min integer not null default 0 check (horas_extras_min >= 0),
  add column if not exists horas_faltas_min integer not null default 0 check (horas_faltas_min >= 0),
  add column if not exists horas_trabalhadas_min integer not null default 0 check (horas_trabalhadas_min >= 0),
  add column if not exists saldo_anterior_min integer not null default 0,
  add column if not exists horas_pagar_desc_min integer not null default 0 check (horas_pagar_desc_min <= 0),
  add column if not exists horas_compensar_min integer not null default 0,
  add column if not exists observacao text not null default '' check (char_length(observacao) <= 2000);

-- Espelhos já importados no formato por dia ganham os totais somando os dias.
update public.banco_horas_espelhos e
set horas_extras_min = coalesce((select sum(d.horas_extras_min) from public.banco_horas_dias d where d.espelho_id = e.id), 0),
    horas_faltas_min = coalesce((select sum(d.horas_faltas_min) from public.banco_horas_dias d where d.espelho_id = e.id), 0),
    horas_trabalhadas_min = coalesce((select sum(d.trabalhado_min) from public.banco_horas_dias d where d.espelho_id = e.id), 0);

-- A tabela banco_horas_dias deixa de ser usada pela tela (o espelho só entrega totais). Fica guardada, sem novas gravações.
