-- Cargo para o qual a pessoa foi promovida. Obrigatório nas publicações do tipo 'promocao'.

alter table public.reconhecimentos add column if not exists cargo_promovido text;

alter table public.reconhecimentos drop constraint if exists reconhecimentos_promocao_com_cargo;
-- NOT VALID: vale para publicações novas e alterações, sem revalidar promoções antigas que foram
-- publicadas antes do campo de cargo existir (essas continuam sem o cargo no texto).
alter table public.reconhecimentos
  add constraint reconhecimentos_promocao_com_cargo
  check (tipo <> 'promocao' or length(btrim(coalesce(cargo_promovido, ''))) > 0)
  not valid;
