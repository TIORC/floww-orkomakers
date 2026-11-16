-- Banners enviados pela tela inicial (botão "Carregar Mídia", acima do banner de aniversariantes).
-- Leitura: qualquer usuário autenticado vê os banners. Escrita: só pelo servidor (service role),
-- que confere se quem envia é o Desenvolvedor do Sistema (conta TI Maracas).

create table if not exists public.home_banners (
  id uuid primary key default gen_random_uuid(),
  src text not null,
  alt text not null default '',
  largura integer not null check (largura > 0),
  altura integer not null check (altura > 0),
  criado_por text,
  criado_em timestamptz not null default now()
);

alter table public.home_banners enable row level security;

drop policy if exists "home_banners: leitura autenticados" on public.home_banners;
create policy "home_banners: leitura autenticados"
  on public.home_banners for select
  to authenticated
  using (true);

-- Bucket público das imagens dos banners. O envio é feito pelo servidor (service role).
insert into storage.buckets (id, name, public)
values ('banners-home', 'banners-home', true)
on conflict (id) do nothing;
