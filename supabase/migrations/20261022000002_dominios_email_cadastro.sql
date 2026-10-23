-- Trava no servidor: só e-mails @gmail.com e @orcoma.com.br podem criar conta no Supabase Auth.
-- A tela já valida, mas a checagem aqui impede o cadastro mesmo chamando a API direto.
-- Contas já existentes não são afetadas: a trigger só roda em INSERT.

create or replace function public.checar_dominio_email_cadastro()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(split_part(coalesce(new.email, ''), '@', 2)) not in ('gmail.com', 'orcoma.com.br') then
    raise exception 'Use um e-mail @gmail.com ou @orcoma.com.br.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists checar_dominio_email_cadastro on auth.users;

create trigger checar_dominio_email_cadastro
  before insert on auth.users
  for each row
  execute function public.checar_dominio_email_cadastro();
