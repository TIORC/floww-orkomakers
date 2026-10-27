-- Área de atuação do sub-líder (ex.: "Célula de Serviço"). Vazio quando a pessoa não é sub-líder.

alter table public.colaboradores_importados
  add column if not exists sublider_area text not null default '';
