-- Tipos de publicação do feed de Reconhecimentos:
--   celebracao      : celebrações (ex.: aniversários). Padrão para o que já existe.
--   reconhecimento  : destaque de alguém em uma reunião ou entrega. (A nota ainda será programada.)
--   promocao        : anúncio de promoção de colaborador. Só Desenvolvedor do Sistema e Administradores podem publicar.

alter table public.reconhecimentos
  add column if not exists tipo text not null default 'celebracao'
  check (tipo in ('celebracao', 'reconhecimento', 'promocao'));

-- Reforça no banco a regra de promoção: quem não é Administrador/Desenvolvedor não consegue publicar esse tipo.
drop policy if exists "reconhecimentos: publicar" on public.reconhecimentos;
create policy "reconhecimentos: publicar"
  on public.reconhecimentos for insert
  to authenticated
  with check (
    lower(autor_email) = lower(auth.jwt() ->> 'email')
    and (tipo <> 'promocao' or public.eh_rh_ou_administracao())
  );
