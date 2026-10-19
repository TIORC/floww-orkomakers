-- Usuário mestre do sistema (criador). Acesso total, sem depender de perfil.
-- A senha NÃO fica neste arquivo: a conta de login é criada no Supabase Auth (ver instruções no chat).

alter table public.colaboradores_importados
  add column if not exists acesso_master boolean not null default false;

insert into public.colaboradores_importados (
  id_planilha,
  nome,
  nome_completo,
  email,
  cargo,
  cargo_visivel,
  departamento,
  situacao,
  origem_cadastro,
  acesso_master
)
values (
  'MASTER-001',
  'TI Maracas',
  'TI Maracas',
  'timaracas@orcoma.com.br',
  'Desenvolvedor do Sistema',
  'Desenvolvedor do Sistema',
  'TI',
  'Ativo',
  'Manual',
  true
)
on conflict (id_planilha) do update
  set acesso_master = true,
      cargo = excluded.cargo,
      cargo_visivel = excluded.cargo_visivel,
      departamento = excluded.departamento,
      atualizado_em = now();
