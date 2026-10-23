-- Ouvidor: permissão especial (não é um nível). Só uma pessoa por vez.
-- O Ouvidor atual transfere o cargo para outro Administrador, usando transferir_ouvidor().

alter table public.colaboradores_importados
  add column if not exists ouvidor boolean not null default false;

create unique index if not exists colaboradores_importados_ouvidor_unico
  on public.colaboradores_importados (ouvidor)
  where ouvidor;

-- Trava no banco: o Ouvidor precisa ser Administrador, e só muda pela função de transferência.
create or replace function public.proteger_ouvidor()
returns trigger
language plpgsql
as $$
begin
  if new.ouvidor then
    if new.nivel_acesso <> 'administrador' then
      raise exception 'O Ouvidor precisa ser Administrador.';
    end if;
    if tg_op = 'INSERT' or not old.ouvidor then
      if current_setting('app.transferindo_ouvidor', true) is distinct from 'on' then
        raise exception 'O cargo de Ouvidor só pode ser transferido pelo Ouvidor atual.';
      end if;
    end if;
  elsif tg_op = 'UPDATE' and old.ouvidor then
    if current_setting('app.transferindo_ouvidor', true) is distinct from 'on' then
      raise exception 'O cargo de Ouvidor só pode ser transferido pelo Ouvidor atual.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_ouvidor on public.colaboradores_importados;
create trigger proteger_ouvidor
  before insert or update of ouvidor, nivel_acesso on public.colaboradores_importados
  for each row execute function public.proteger_ouvidor();

-- Transferência feita pelo Ouvidor atual (quem está logado) para um Administrador.
create or replace function public.transferir_ouvidor(destino_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  email_atual text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if not exists (
    select 1 from public.colaboradores_importados
    where lower(email) = email_atual and ouvidor
  ) then
    raise exception 'Somente o Ouvidor atual pode transferir o cargo.';
  end if;

  if not exists (
    select 1 from public.colaboradores_importados
    where id = destino_id and nivel_acesso = 'administrador'
  ) then
    raise exception 'O novo Ouvidor precisa ser Administrador.';
  end if;

  perform set_config('app.transferindo_ouvidor', 'on', true);

  update public.colaboradores_importados
    set ouvidor = false, atualizado_em = now()
  where ouvidor;

  update public.colaboradores_importados
    set ouvidor = true, atualizado_em = now()
  where id = destino_id;
end;
$$;

grant execute on function public.transferir_ouvidor(uuid) to authenticated;

-- Cléo Barros é a Ouvidora atual.
select set_config('app.transferindo_ouvidor', 'on', true);

update public.colaboradores_importados
  set ouvidor = true,
      atualizado_em = now()
where lower(email) = 'cleo@orcoma.com.br';
