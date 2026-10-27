-- Observação livre do RH sobre o desligamento do colaborador.
-- Fica vazia para as linhas existentes.

alter table public.colaboradores_importados
  add column if not exists observacao_desligamento text not null default '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'colab_observacao_desligamento_tamanho') then
    alter table public.colaboradores_importados
      add constraint colab_observacao_desligamento_tamanho
      check (char_length(observacao_desligamento) <= 6000);
  end if;
end
$$;
