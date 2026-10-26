-- Prazo da desativação: até quando e a que horas a pessoa fica afastada (ex.: fim da licença ou das férias).
-- Preenchido por Administradores e pelo Desenvolvedor do Sistema. Linhas antigas ficam vazias.
alter table public.colaboradores_importados
  add column if not exists desativacao_ate timestamptz;
