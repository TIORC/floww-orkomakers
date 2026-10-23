-- Motivo da desativação: afastamentos temporários (férias, licença, lua de mel...).
-- Quem está desativado tem situacao = 'Desativado' e NÃO recebe data de desligamento.
-- Os campos ficam vazios para as linhas já existentes.

alter table public.colaboradores_importados
  add column if not exists motivo_desativacao text not null default '',
  add column if not exists motivo_desativacao_outros text not null default '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'colab_motivo_desativacao_valido') then
    alter table public.colaboradores_importados
      add constraint colab_motivo_desativacao_valido
      check (motivo_desativacao in (
        '',
        'Férias',
        'Licença Maternidade',
        'Licença Paternidade',
        'Licença Médica',
        'Lua de Mel',
        'Afastamento',
        'Outros'
      ));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'colab_motivo_desativacao_outros_tamanho') then
    alter table public.colaboradores_importados
      add constraint colab_motivo_desativacao_outros_tamanho
      check (char_length(motivo_desativacao_outros) <= 6000);
  end if;
end
$$;
