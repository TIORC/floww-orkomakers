-- Níveis de acesso (Administrador, Gestor, Colaborador, Convidado).
-- Nível é independente do cargo. Todos começam como Colaborador.
-- Os gestores e os administradores são definidos depois, por esta migração ou manualmente.

alter table public.colaboradores_importados
  add column if not exists nivel_acesso text not null default 'colaborador';

alter table public.colaboradores_importados
  drop constraint if exists colaboradores_importados_nivel_acesso_check;

alter table public.colaboradores_importados
  add constraint colaboradores_importados_nivel_acesso_check
  check (nivel_acesso in ('desenvolvedor', 'administrador', 'gestor', 'colaborador', 'convidado'));

-- Desenvolvedor do Sistema (Criador): exclusivo da conta TI Maracas e impossível de remover.
-- A trava fica no banco, para valer mesmo fora da tela.
create or replace function public.proteger_nivel_desenvolvedor()
returns trigger
language plpgsql
as $$
begin
  if lower(new.email) = 'timaracas@orcoma.com.br' and new.nivel_acesso <> 'desenvolvedor' then
    raise exception 'O papel de Desenvolvedor do Sistema não pode ser removido desta conta.';
  end if;
  if new.nivel_acesso = 'desenvolvedor' and lower(new.email) <> 'timaracas@orcoma.com.br' then
    raise exception 'O papel de Desenvolvedor do Sistema é exclusivo de uma conta.';
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_nivel_desenvolvedor on public.colaboradores_importados;
create trigger proteger_nivel_desenvolvedor
  before insert or update of nivel_acesso, email on public.colaboradores_importados
  for each row execute function public.proteger_nivel_desenvolvedor();

-- Conta TI Maracas recebe o papel Desenvolvedor do Sistema.
update public.colaboradores_importados
  set nivel_acesso = 'desenvolvedor',
      atualizado_em = now()
where lower(email) = 'timaracas@orcoma.com.br';

-- Administradores: Celso Alcantara, Cléo Barros, Jacson Mascarenhas e Yasmin Pires.
-- Conferir antes de aplicar: cada nome deve afetar exatamente 1 linha.
update public.colaboradores_importados
  set nivel_acesso = 'administrador',
      atualizado_em = now()
where nome_completo in (
  'Celso Alcantara',
  'Cléo Barros',
  'Jacson Mascarenhas',
  'Yasmin Pires'
)
or nome in (
  'Celso Alcantara',
  'Cléo Barros',
  'Jacson Mascarenhas',
  'Yasmin Pires'
);

-- Gestores: Geane Lopes, Gilton Novaes, Joyce Narde, Macleide Ramos, Olandson de Jesus,
-- Patrick Novaes, Samuel Rizzuto, Suzane Souza, Tainá Pires, Talita Silva e Welder Silva.
-- Conferir antes de aplicar: cada nome deve afetar exatamente 1 linha.
update public.colaboradores_importados
  set nivel_acesso = 'gestor',
      atualizado_em = now()
where nome_completo in (
  'Geane Lopes',
  'Gilton Novaes',
  'Joyce Narde',
  'Macleide Ramos',
  'Olandson de Jesus',
  'Patrick Novaes',
  'Samuel Rizzuto',
  'Suzane Souza',
  'Tainá Pires',
  'Talita Silva',
  'Welder Silva'
)
or nome in (
  'Geane Lopes',
  'Gilton Novaes',
  'Joyce Narde',
  'Macleide Ramos',
  'Olandson de Jesus',
  'Patrick Novaes',
  'Samuel Rizzuto',
  'Suzane Souza',
  'Tainá Pires',
  'Talita Silva',
  'Welder Silva'
);
