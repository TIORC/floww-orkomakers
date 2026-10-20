-- Cadastro dos setores da empresa, com a sigla de cada um.
-- Nomes repetidos ou já existentes são ignorados.
insert into public.setores (nome, sigla) values
  ('Departamento Pessoal', 'DP'),
  ('Departamento Fiscal', 'FC'),
  ('Departamento Contábil', 'CT'),
  ('Departamento TI', 'TI'),
  ('Recepção', 'REC'),
  ('Departamento Financeiro', 'FIN'),
  ('Departamento Qualidade', 'QL'),
  ('Departamento Técnico', 'TEC'),
  ('RH', 'RH'),
  ('Departamento Social Media', 'SM'),
  ('Departamento Societário', 'SC'),
  ('Departamento Sucesso do Cliente', 'SCL'),
  ('Departamento Comercial', 'COM'),
  ('BPO Financeiro', 'BPO'),
  ('CEO', 'CEO'),
  ('Limpeza', 'LMP'),
  ('Transportes', 'TRP')
on conflict (nome) do nothing;

-- Alinha o setor dos cargos com os nomes do cadastro de setores.
-- Antes de renomear, remove a versão antiga quando o mesmo cargo já existe no setor novo.
delete from public.cargos c using public.cargos d
  where c.setor <> d.setor and lower(d.nome) = lower(c.nome)
  and d.setor = case c.setor
    when 'Comercial' then 'Departamento Comercial'
    when 'Fiscal' then 'Departamento Fiscal'
    when 'Contábil' then 'Departamento Contábil'
    when 'Financeiro' then 'Departamento Financeiro'
    when 'Qualidade' then 'Departamento Qualidade'
    when 'Técnico' then 'Departamento Técnico'
    when 'Societário' then 'Departamento Societário'
    when 'TI' then 'Departamento TI'
    when 'Mídias Sociais' then 'Departamento Social Media'
    when 'Sucesso do Cliente' then 'Departamento Sucesso do Cliente'
  end;

update public.cargos set setor = 'Departamento Comercial' where setor = 'Comercial';
update public.cargos set setor = 'Departamento Fiscal' where setor = 'Fiscal';
update public.cargos set setor = 'Departamento Contábil' where setor = 'Contábil';
update public.cargos set setor = 'Departamento Financeiro' where setor = 'Financeiro';
update public.cargos set setor = 'Departamento Qualidade' where setor = 'Qualidade';
update public.cargos set setor = 'Departamento Técnico' where setor = 'Técnico';
update public.cargos set setor = 'Departamento Societário' where setor = 'Societário';
update public.cargos set setor = 'Departamento TI' where setor = 'TI';
update public.cargos set setor = 'Departamento Social Media' where setor = 'Mídias Sociais';
update public.cargos set setor = 'Departamento Sucesso do Cliente' where setor = 'Sucesso do Cliente';
