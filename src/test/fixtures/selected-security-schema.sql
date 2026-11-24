-- Baseline selected-table schema and policies captured before the security fix.
-- All rows and accounts below exist only in the isolated test database.
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role BYPASSRLS;
CREATE SCHEMA auth;
GRANT USAGE ON SCHEMA auth TO authenticated, anon, service_role;
CREATE TABLE auth.users (id uuid PRIMARY KEY, email text NOT NULL, raw_user_meta_data jsonb DEFAULT '{}');
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb; $$;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(auth.jwt()->>'sub', '')::uuid; $$;
CREATE TABLE public.avisos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo text NOT NULL,
  solicitante_email text NOT NULL,
  solicitante_nome text NOT NULL DEFAULT ''::text,
  setor text NOT NULL DEFAULT ''::text,
  gestor_email text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pendente'::text,
  motivo_recusa text NOT NULL DEFAULT ''::text,
  decidido_por_email text,
  decidido_por_nome text NOT NULL DEFAULT ''::text,
  decidido_em timestamp with time zone,
  criado_em timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avisos TO authenticated;
GRANT ALL ON public.avisos TO service_role;
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.cargo_senioridades (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cargo_id uuid NOT NULL,
  nivel text NOT NULL,
  faixa_minima numeric NOT NULL,
  salario_base numeric NOT NULL,
  faixa_maxima numeric NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  criado_em timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cargo_senioridades TO authenticated;
GRANT ALL ON public.cargo_senioridades TO service_role;
ALTER TABLE public.cargo_senioridades ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.cargos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  cbo text NOT NULL DEFAULT ''::text,
  setor text NOT NULL,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cargos TO authenticated;
GRANT ALL ON public.cargos TO service_role;
ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.checkin_sentimento (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_email text NOT NULL,
  data date NOT NULL DEFAULT CURRENT_DATE,
  emocao text NOT NULL,
  motivo text NOT NULL DEFAULT ''::text,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checkin_sentimento TO authenticated;
GRANT ALL ON public.checkin_sentimento TO service_role;
ALTER TABLE public.checkin_sentimento ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.colaboradores_importados (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_planilha text NOT NULL,
  nome text NOT NULL,
  nome_completo text NOT NULL,
  matricula text NOT NULL DEFAULT ''::text,
  email text NOT NULL,
  cpf text NOT NULL DEFAULT ''::text,
  cargo text NOT NULL DEFAULT ''::text,
  cargo_visivel text NOT NULL DEFAULT ''::text,
  unidade text NOT NULL DEFAULT ''::text,
  departamento text NOT NULL DEFAULT ''::text,
  grupos text NOT NULL DEFAULT ''::text,
  papel text NOT NULL DEFAULT ''::text,
  gestor_direto text NOT NULL DEFAULT ''::text,
  etnia text NOT NULL DEFAULT ''::text,
  sexo text NOT NULL DEFAULT ''::text,
  genero text NOT NULL DEFAULT ''::text,
  data_nascimento text NOT NULL DEFAULT ''::text,
  data_admissao text NOT NULL DEFAULT ''::text,
  data_cadastro text NOT NULL DEFAULT ''::text,
  situacao text NOT NULL DEFAULT ''::text,
  ultimo_acesso text NOT NULL DEFAULT ''::text,
  origem_cadastro text NOT NULL DEFAULT ''::text,
  gestor_direto_email text NOT NULL DEFAULT ''::text,
  participa_gamificacao text NOT NULL DEFAULT ''::text,
  desligamento text NOT NULL DEFAULT ''::text,
  ultimo_dia_trabalhado text NOT NULL DEFAULT ''::text,
  biografia text NOT NULL DEFAULT ''::text,
  idioma text NOT NULL DEFAULT ''::text,
  foto_url text,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now(),
  acesso_master boolean NOT NULL DEFAULT false,
  tipo_desligamento text NOT NULL DEFAULT ''::text,
  motivo_desligamento text NOT NULL DEFAULT ''::text,
  motivo_desligamento_outros text NOT NULL DEFAULT ''::text,
  nivel_acesso text NOT NULL DEFAULT 'colaborador'::text,
  ouvidor boolean NOT NULL DEFAULT false,
  desativacao_ate timestamp with time zone,
  observacao_desligamento text NOT NULL DEFAULT ''::text,
  sublider_area text NOT NULL DEFAULT ''::text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.colaboradores_importados TO authenticated;
GRANT ALL ON public.colaboradores_importados TO service_role;
ALTER TABLE public.colaboradores_importados ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.comunicados (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  autor_id uuid NOT NULL DEFAULT auth.uid(),
  titulo text NOT NULL,
  mensagem text NOT NULL,
  publico_tipo text NOT NULL DEFAULT 'todos'::text,
  publico_valores text[] NOT NULL DEFAULT '{}'::text[],
  destaque boolean NOT NULL DEFAULT false,
  publicado_em timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comunicados TO authenticated;
GRANT ALL ON public.comunicados TO service_role;
ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.feriados_cadastrados (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  data date NOT NULL,
  recorrente boolean NOT NULL DEFAULT false,
  tipo text NOT NULL,
  abrangencia text NOT NULL DEFAULT ''::text,
  criado_por_email text NOT NULL DEFAULT ''::text,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feriados_cadastrados TO authenticated;
GRANT ALL ON public.feriados_cadastrados TO service_role;
ALTER TABLE public.feriados_cadastrados ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.ferias_programadas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_email text NOT NULL,
  colaborador_nome text NOT NULL DEFAULT ''::text,
  inicio date NOT NULL,
  fim date NOT NULL,
  programado_por_email text NOT NULL,
  criado_em timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ferias_programadas TO authenticated;
GRANT ALL ON public.ferias_programadas TO service_role;
ALTER TABLE public.ferias_programadas ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.historico_ranking_mensal (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ano integer NOT NULL,
  mes integer NOT NULL,
  posicao integer NOT NULL,
  colaborador_id uuid,
  nome text NOT NULL,
  setor text NOT NULL DEFAULT ''::text,
  foto_url text,
  pontos integer NOT NULL DEFAULT 0,
  meta integer NOT NULL DEFAULT 5000,
  criado_em timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.historico_ranking_mensal TO authenticated;
GRANT ALL ON public.historico_ranking_mensal TO service_role;
ALTER TABLE public.historico_ranking_mensal ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.inventory_mobile_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  ti_name text NOT NULL,
  equipamento text NOT NULL,
  categoria_id uuid,
  patrimonio text,
  tipo text NOT NULL,
  data date NOT NULL DEFAULT CURRENT_DATE,
  es_text text,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_mobile_entries TO authenticated;
GRANT ALL ON public.inventory_mobile_entries TO service_role;
ALTER TABLE public.inventory_mobile_entries ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.notificacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destinatario_email text NOT NULL,
  tipo text NOT NULL DEFAULT 'geral'::text,
  texto text NOT NULL,
  ator_nome text NOT NULL DEFAULT ''::text,
  ator_foto_url text,
  lida boolean NOT NULL DEFAULT false,
  criada_em timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notificacoes TO authenticated;
GRANT ALL ON public.notificacoes TO service_role;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.reconhecimento_comentarios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reconhecimento_id uuid NOT NULL,
  autor_email text NOT NULL,
  autor_nome text NOT NULL DEFAULT ''::text,
  texto text NOT NULL,
  criado_em timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reconhecimento_comentarios TO authenticated;
GRANT ALL ON public.reconhecimento_comentarios TO service_role;
ALTER TABLE public.reconhecimento_comentarios ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.reconhecimento_curtidas (
  reconhecimento_id uuid NOT NULL,
  colaborador_email text NOT NULL,
  criado_em timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reconhecimento_curtidas TO authenticated;
GRANT ALL ON public.reconhecimento_curtidas TO service_role;
ALTER TABLE public.reconhecimento_curtidas ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.reconhecimento_mencoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reconhecimento_id uuid NOT NULL,
  tipo text NOT NULL,
  valor text NOT NULL,
  rotulo text NOT NULL,
  foto_url text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reconhecimento_mencoes TO authenticated;
GRANT ALL ON public.reconhecimento_mencoes TO service_role;
ALTER TABLE public.reconhecimento_mencoes ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.reconhecimentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  autor_email text NOT NULL,
  autor_nome text NOT NULL DEFAULT ''::text,
  autor_foto text,
  mensagem text NOT NULL,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  tipo text NOT NULL DEFAULT 'celebracao'::text,
  cargo_promovido text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reconhecimentos TO authenticated;
GRANT ALL ON public.reconhecimentos TO service_role;
ALTER TABLE public.reconhecimentos ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.respostas_pesquisa (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pesquisa text NOT NULL,
  colaborador_email text NOT NULL,
  resposta jsonb NOT NULL DEFAULT '{}'::jsonb,
  respondido_em timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.respostas_pesquisa TO authenticated;
GRANT ALL ON public.respostas_pesquisa TO service_role;
ALTER TABLE public.respostas_pesquisa ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.setores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  sigla text NOT NULL,
  criado_em timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.setores TO authenticated;
GRANT ALL ON public.setores TO service_role;
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.vagas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cargo_id uuid NOT NULL,
  setor text NOT NULL,
  titulo text NOT NULL,
  status text NOT NULL DEFAULT 'ativa'::text,
  criado_por uuid DEFAULT auth.uid(),
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  detalhes jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vagas TO authenticated;
GRANT ALL ON public.vagas TO service_role;
ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.eh_rh_ou_administracao() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS (SELECT 1 FROM public.colaboradores_importados c WHERE lower(c.email)=lower(auth.jwt()->>'email') AND (c.acesso_master OR c.nivel_acesso IN ('administrador','desenvolvedor'))); $$;
CREATE FUNCTION public.eh_gestao_ou_administracao() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS (SELECT 1 FROM public.colaboradores_importados c WHERE lower(c.email)=lower(auth.jwt()->>'email') AND (c.acesso_master OR c.nivel_acesso IN ('administrador','desenvolvedor','gestor'))); $$;
CREATE POLICY "authenticated can read colaboradores_importados" ON public.colaboradores_importados FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated can insert colaboradores_importados" ON public.colaboradores_importados FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated can update colaboradores_importados" ON public.colaboradores_importados FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated can delete colaboradores_importados" ON public.colaboradores_importados FOR DELETE TO authenticated USING (true);
CREATE POLICY "authenticated can read historico_ranking_mensal" ON public.historico_ranking_mensal FOR SELECT TO authenticated USING (true);
CREATE POLICY "destinatario le as proprias notificacoes" ON public.notificacoes FOR SELECT TO authenticated USING ((lower(destinatario_email) = lower((auth.jwt() ->> 'email'::text))));
CREATE POLICY "destinatario marca as proprias notificacoes" ON public.notificacoes FOR UPDATE TO authenticated USING ((lower(destinatario_email) = lower((auth.jwt() ->> 'email'::text)))) WITH CHECK ((lower(destinatario_email) = lower((auth.jwt() ->> 'email'::text))));
CREATE POLICY "authenticated pode criar notificacoes" ON public.notificacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated can read vagas" ON public.vagas FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated can insert vagas" ON public.vagas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated can delete cargo_senioridades" ON public.cargo_senioridades FOR DELETE TO authenticated USING (true);
CREATE POLICY "pessoa registra o proprio checkin" ON public.checkin_sentimento FOR INSERT TO authenticated WITH CHECK ((lower(colaborador_email) = lower((auth.jwt() ->> 'email'::text))));
CREATE POLICY "pessoa altera o proprio checkin" ON public.checkin_sentimento FOR UPDATE TO authenticated USING ((lower(colaborador_email) = lower((auth.jwt() ->> 'email'::text)))) WITH CHECK ((lower(colaborador_email) = lower((auth.jwt() ->> 'email'::text))));
CREATE POLICY "authenticated le checkins" ON public.checkin_sentimento FOR SELECT TO authenticated USING (true);
CREATE POLICY "pessoa responde a propria pesquisa" ON public.respostas_pesquisa FOR INSERT TO authenticated WITH CHECK ((lower(colaborador_email) = lower((auth.jwt() ->> 'email'::text))));
CREATE POLICY "authenticated le respostas de pesquisa" ON public.respostas_pesquisa FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated can read setores" ON public.setores FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated can insert setores" ON public.setores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated can update setores" ON public.setores FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated can delete setores" ON public.setores FOR DELETE TO authenticated USING (true);
CREATE POLICY "authenticated can read cargos" ON public.cargos FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated can insert cargos" ON public.cargos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated can update cargos" ON public.cargos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated can delete cargos" ON public.cargos FOR DELETE TO authenticated USING (true);
CREATE POLICY "authenticated can read cargo_senioridades" ON public.cargo_senioridades FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated can insert cargo_senioridades" ON public.cargo_senioridades FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated can update cargo_senioridades" ON public.cargo_senioridades FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "ferias programadas: programar" ON public.ferias_programadas FOR INSERT TO authenticated WITH CHECK (((lower(programado_por_email) = lower((auth.jwt() ->> 'email'::text))) AND (EXISTS ( SELECT 1
   FROM colaboradores_importados c
  WHERE ((lower(c.email) = lower((auth.jwt() ->> 'email'::text))) AND (c.acesso_master OR (c.nivel_acesso = ANY (ARRAY['gestor'::text, 'administrador'::text, 'desenvolvedor'::text]))))))));
CREATE POLICY "logados leem comunicados" ON public.comunicados FOR SELECT TO authenticated USING (true);
CREATE POLICY "logados publicam" ON public.comunicados FOR INSERT TO authenticated WITH CHECK ((autor_id = auth.uid()));
CREATE POLICY "ferias programadas: leitura" ON public.ferias_programadas FOR SELECT TO authenticated USING (true);
CREATE POLICY "ferias programadas: remover" ON public.ferias_programadas FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM colaboradores_importados c
  WHERE ((lower(c.email) = lower((auth.jwt() ->> 'email'::text))) AND (c.acesso_master OR (c.nivel_acesso = ANY (ARRAY['gestor'::text, 'administrador'::text, 'desenvolvedor'::text])))))));
CREATE POLICY "administracao exclui vagas" ON public.vagas FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM colaboradores_importados c
  WHERE ((lower(c.email) = lower((auth.jwt() ->> 'email'::text))) AND (c.acesso_master OR (c.nivel_acesso = ANY (ARRAY['administrador'::text, 'desenvolvedor'::text])))))));
CREATE POLICY "administracao atualiza vagas" ON public.vagas FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM colaboradores_importados c
  WHERE ((lower(c.email) = lower((auth.jwt() ->> 'email'::text))) AND (c.acesso_master OR (c.nivel_acesso = ANY (ARRAY['administrador'::text, 'desenvolvedor'::text]))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM colaboradores_importados c
  WHERE ((lower(c.email) = lower((auth.jwt() ->> 'email'::text))) AND (c.acesso_master OR (c.nivel_acesso = ANY (ARRAY['administrador'::text, 'desenvolvedor'::text])))))));
CREATE POLICY "reconhecimentos: leitura autenticados" ON public.reconhecimentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "reconhecimento_curtidas: leitura autenticados" ON public.reconhecimento_curtidas FOR SELECT TO authenticated USING (true);
CREATE POLICY "reconhecimento_curtidas: curtir" ON public.reconhecimento_curtidas FOR INSERT TO authenticated WITH CHECK ((lower(colaborador_email) = lower((auth.jwt() ->> 'email'::text))));
CREATE POLICY "reconhecimento_curtidas: descurtir" ON public.reconhecimento_curtidas FOR DELETE TO authenticated USING ((lower(colaborador_email) = lower((auth.jwt() ->> 'email'::text))));
CREATE POLICY "reconhecimento_comentarios: leitura autenticados" ON public.reconhecimento_comentarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "reconhecimento_comentarios: comentar" ON public.reconhecimento_comentarios FOR INSERT TO authenticated WITH CHECK ((lower(autor_email) = lower((auth.jwt() ->> 'email'::text))));
CREATE POLICY "reconhecimento_mencoes: leitura autenticados" ON public.reconhecimento_mencoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "reconhecimento_mencoes: marcar" ON public.reconhecimento_mencoes FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM reconhecimentos r
  WHERE ((r.id = reconhecimento_mencoes.reconhecimento_id) AND (lower(r.autor_email) = lower((auth.jwt() ->> 'email'::text)))))));
CREATE POLICY "reconhecimentos: publicar" ON public.reconhecimentos FOR INSERT TO authenticated WITH CHECK (((lower(autor_email) = lower((auth.jwt() ->> 'email'::text))) AND ((tipo <> 'promocao'::text) OR eh_rh_ou_administracao())));
CREATE POLICY "mobile_entries_read" ON public.inventory_mobile_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "mobile_entries_insert" ON public.inventory_mobile_entries FOR INSERT TO authenticated WITH CHECK ((created_by = auth.uid()));
CREATE POLICY "mobile_entries_delete" ON public.inventory_mobile_entries FOR DELETE TO authenticated USING (true);
CREATE POLICY "feriados cadastrados: leitura" ON public.feriados_cadastrados FOR SELECT TO authenticated USING (true);
CREATE POLICY "feriados cadastrados: gravar" ON public.feriados_cadastrados FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM colaboradores_importados c
  WHERE ((lower(c.email) = lower((auth.jwt() ->> 'email'::text))) AND (c.acesso_master OR (c.nivel_acesso = ANY (ARRAY['administrador'::text, 'desenvolvedor'::text]))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM colaboradores_importados c
  WHERE ((lower(c.email) = lower((auth.jwt() ->> 'email'::text))) AND (c.acesso_master OR (c.nivel_acesso = ANY (ARRAY['administrador'::text, 'desenvolvedor'::text])))))));
