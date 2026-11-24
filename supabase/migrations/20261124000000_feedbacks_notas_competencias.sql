-- Notas de 0 a 5 por competência em cada feedback. Feedbacks antigos ficam sem nota (null)
-- e não entram na média do card Constância.

alter table public.feedbacks
  add column if not exists nota_proatividade_autonomia smallint check (nota_proatividade_autonomia between 0 and 5),
  add column if not exists nota_confiabilidade_transparencia smallint check (nota_confiabilidade_transparencia between 0 and 5),
  add column if not exists nota_encantamento_cliente smallint check (nota_encantamento_cliente between 0 and 5),
  add column if not exists nota_responsabilidade_produtividade smallint check (nota_responsabilidade_produtividade between 0 and 5);
