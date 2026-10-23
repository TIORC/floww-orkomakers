-- Motivo do desligamento registrado pelo RH ao desligar um colaborador.
-- Alimenta os relatorios de turnover em /pesquisa-desligamento.
-- Os campos novos ficam vazios para as linhas ja importadas (o historico segue no campo "desligamento").

alter table public.colaboradores_importados
  add column if not exists tipo_desligamento text not null default '',
  add column if not exists motivo_desligamento text not null default '',
  add column if not exists motivo_desligamento_outros text not null default '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'colab_tipo_desligamento_valido') then
    alter table public.colaboradores_importados
      add constraint colab_tipo_desligamento_valido
      check (tipo_desligamento in ('', 'Voluntário', 'Involuntário', 'Não Classificado'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'colab_motivo_desligamento_valido') then
    alter table public.colaboradores_importados
      add constraint colab_motivo_desligamento_valido
      check (motivo_desligamento in (
        '',
        'Baixa Produtividade/Desempenho',
        'Salário',
        'Nova Oportunidade',
        'Demissão sem justa causa',
        'Demissão com justa causa',
        'Problemas de Saúde',
        'Insatisfação',
        'Insatisfação c/ Chefia',
        'Insatisfação c/ Empresa',
        'Outros'
      ));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'colab_motivo_outros_tamanho') then
    alter table public.colaboradores_importados
      add constraint colab_motivo_outros_tamanho
      check (char_length(motivo_desligamento_outros) <= 6000);
  end if;
end
$$;
