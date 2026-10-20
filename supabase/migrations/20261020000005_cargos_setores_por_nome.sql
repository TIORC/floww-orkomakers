-- Remove duplicados sem setor quando o mesmo cargo já existe com setor (evita erro de chave única).
delete from public.cargos c using public.cargos d
  where c.setor = '' and d.setor <> '' and lower(d.nome) = lower(c.nome);

-- Define o setor dos cargos pelo nome, só nos que ainda estão sem setor.
-- Ex.: "Assistente Comercial" -> Comercial; "Auxiliar Fiscal" -> Fiscal.
-- Cargos sem palavra-chave reconhecível continuam sem setor e são preenchidos na tela.

update public.cargos set setor = 'Comercial'
  where setor = '' and nome ~* 'comercial';

update public.cargos set setor = 'Fiscal'
  where setor = '' and nome ~* 'fiscal';

update public.cargos set setor = 'Contábil'
  where setor = '' and nome ~* 'contábil|contabil';

update public.cargos set setor = 'Financeiro'
  where setor = '' and nome ~* 'financeiro';

update public.cargos set setor = 'Departamento Pessoal'
  where setor = '' and nome ~* 'departamento pessoal|depto pessoal|\yDP\y|\yPessoal\y';

update public.cargos set setor = 'RH'
  where setor = '' and nome ~* '\yRH\y';

update public.cargos set setor = 'TI'
  where setor = '' and nome ~* '\yTI\y';

update public.cargos set setor = 'Qualidade'
  where setor = '' and nome ~* 'qualidade';

update public.cargos set setor = 'Societário'
  where setor = '' and nome ~* 'societ';

update public.cargos set setor = 'Mídias Sociais'
  where setor = '' and nome ~* 'mídias sociais|midias sociais|social media';

update public.cargos set setor = 'Limpeza'
  where setor = '' and nome ~* 'limpeza';

update public.cargos set setor = 'Técnico'
  where setor = '' and nome ~* 'técnico|tecnico';

update public.cargos set setor = 'Transportes'
  where setor = '' and nome ~* 'motorista';

update public.cargos set setor = 'CEO'
  where setor = '' and nome ~* '^ceo$';

update public.cargos set setor = 'Recepção'
  where setor = '' and nome ~* 'recepcionista';

update public.cargos set setor = 'Sucesso do Cliente'
  where setor = '' and nome ~* 'relacionamento';

update public.cargos set setor = 'Arquivo'
  where setor = '' and nome ~* 'arquivo';
