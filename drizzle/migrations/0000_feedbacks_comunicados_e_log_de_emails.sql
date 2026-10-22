CREATE TABLE public.feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id uuid NOT NULL DEFAULT auth.uid(),
  autor_email text NOT NULL,
  destinatario_email text NOT NULL,
  mensagem text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.feedbacks TO authenticated;
GRANT ALL ON public.feedbacks TO service_role;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "autor cria feedback" ON public.feedbacks FOR INSERT TO authenticated WITH CHECK (autor_id = auth.uid());
CREATE POLICY "autor ou destinatario le" ON public.feedbacks FOR SELECT TO authenticated
  USING (autor_id = auth.uid() OR destinatario_email = (auth.jwt() ->> 'email'));

CREATE TABLE public.comunicados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id uuid NOT NULL DEFAULT auth.uid(),
  titulo text NOT NULL,
  mensagem text NOT NULL,
  publico_tipo text NOT NULL DEFAULT 'todos',
  publico_valores text[] NOT NULL DEFAULT '{}',
  destaque boolean NOT NULL DEFAULT false,
  publicado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.comunicados TO authenticated;
GRANT ALL ON public.comunicados TO service_role;
ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logados leem comunicados" ON public.comunicados FOR SELECT TO authenticated USING (true);
CREATE POLICY "logados publicam" ON public.comunicados FOR INSERT TO authenticated WITH CHECK (autor_id = auth.uid());

CREATE TABLE public.email_envios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento text NOT NULL,
  referencia text NOT NULL,
  destinatario text,
  assunto text,
  status text NOT NULL,
  detalhe text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.email_envios TO service_role;
ALTER TABLE public.email_envios ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX email_envios_humor_dia ON public.email_envios (referencia) WHERE evento = 'humor_baixo' AND status = 'enviado';