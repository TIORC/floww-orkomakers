-- Departamento do colaborador no espelho de ponto. O PDF não traz esse dado; ele vem do nome do arquivo
-- ("Espelho - NOME - Dpto. TI.pdf" guarda "TI"). Espelhos já importados ficam vazios até serem importados de novo.
alter table public.banco_horas_espelhos
  add column if not exists colaborador_departamento text not null default '';
