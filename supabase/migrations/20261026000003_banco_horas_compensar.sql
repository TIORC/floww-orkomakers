-- Horas para compensar, preenchidas à mão pelo RH em cada dia. Guardadas em minutos com sinal:
-- positivo (+13:00 = 780) ou negativo (-13:00 = -780). Zero significa que não foi informado.
alter table public.banco_horas_dias
  add column if not exists horas_compensar_min integer not null default 0;
