-- Saldo anterior automático: vazio (null) significa "calcular": é o banco de horas do período anterior do mesmo
-- colaborador (saldo anterior + extras - faltas). Quando o RH digita um valor, ele vale no lugar do cálculo.
alter table public.banco_horas_espelhos
  alter column saldo_anterior_min drop not null,
  alter column saldo_anterior_min drop default;

-- Zero era só "ainda não digitado": passa a ser automático.
update public.banco_horas_espelhos set saldo_anterior_min = null where saldo_anterior_min = 0;
