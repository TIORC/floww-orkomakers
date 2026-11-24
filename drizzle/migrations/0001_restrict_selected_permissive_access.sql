-- Only the sixteen selected permissive-policy findings are changed.
-- Existing employee roles are copied into a protected, stable-user membership table.
CREATE TABLE public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  colaborador_id uuid NOT NULL REFERENCES public.colaboradores_importados(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('desenvolvedor', 'administrador', 'gestor', 'colaborador', 'convidado'))
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read their own protected role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- This backfill is part of the additive role-table change, not a data repair.
INSERT INTO public.user_roles (user_id, colaborador_id, role)
SELECT u.id, c.id, CASE WHEN c.acesso_master THEN 'desenvolvedor' ELSE c.nivel_acesso END
FROM auth.users u JOIN public.colaboradores_importados c ON lower(c.email) = lower(u.email);

CREATE FUNCTION public.seguranca_tem_papel(papeis text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles r
    JOIN public.colaboradores_importados c ON c.id = r.colaborador_id
    WHERE r.user_id = (SELECT auth.uid()) AND r.role = ANY(papeis)
      AND lower(btrim(c.situacao)) IN ('ativo', 'desativado')
      AND btrim(c.desligamento) = '' AND btrim(c.ultimo_dia_trabalhado) = ''
  );
$$;
REVOKE ALL ON FUNCTION public.seguranca_tem_papel(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seguranca_tem_papel(text[]) TO authenticated, service_role;

CREATE FUNCTION public.seguranca_membro_interno()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.seguranca_tem_papel(ARRAY['desenvolvedor','administrador','gestor','colaborador']); $$;
REVOKE ALL ON FUNCTION public.seguranca_membro_interno() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seguranca_membro_interno() TO authenticated, service_role;

CREATE FUNCTION public.seguranca_administracao()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.seguranca_tem_papel(ARRAY['desenvolvedor','administrador']); $$;
REVOKE ALL ON FUNCTION public.seguranca_administracao() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seguranca_administracao() TO authenticated, service_role;

CREATE FUNCTION public.seguranca_le_registro_pessoal(email_alvo text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.seguranca_membro_interno() AND (
    public.seguranca_administracao()
    OR EXISTS (
      SELECT 1 FROM public.user_roles r
      JOIN public.colaboradores_importados pessoa ON pessoa.id = r.colaborador_id
      WHERE r.user_id = (SELECT auth.uid()) AND (
        lower(pessoa.email) = lower(email_alvo)
        OR (r.role = 'gestor' AND EXISTS (
          SELECT 1 FROM public.colaboradores_importados equipe
          WHERE lower(equipe.email) = lower(email_alvo)
            AND lower(equipe.gestor_direto_email) = lower(pessoa.email)
        ))
      )
    )
  );
$$;
REVOKE ALL ON FUNCTION public.seguranca_le_registro_pessoal(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seguranca_le_registro_pessoal(text) TO authenticated, service_role;

-- Employee edits are admin-only below; clients cannot write this role table.
-- Mirrors are updated atomically when an authorized admin changes an employee.
CREATE FUNCTION public.seguranca_sincronizar_papel_colaborador()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_roles WHERE colaborador_id = NEW.id;
  INSERT INTO public.user_roles (user_id, colaborador_id, role)
  SELECT u.id, NEW.id, CASE WHEN NEW.acesso_master THEN 'desenvolvedor' ELSE NEW.nivel_acesso END
  FROM auth.users u WHERE lower(u.email) = lower(NEW.email)
  ON CONFLICT (user_id) DO UPDATE SET colaborador_id = EXCLUDED.colaborador_id, role = EXCLUDED.role;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.seguranca_sincronizar_papel_colaborador() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER seguranca_sincronizar_papel_colaborador
AFTER INSERT OR UPDATE OF email, nivel_acesso, acesso_master ON public.colaboradores_importados
FOR EACH ROW EXECUTE FUNCTION public.seguranca_sincronizar_papel_colaborador();

-- Signup metadata cannot grant access: only an existing employee record can.
CREATE FUNCTION public.seguranca_vincular_conta_colaborador()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_roles WHERE user_id = NEW.id;
  INSERT INTO public.user_roles (user_id, colaborador_id, role)
  SELECT NEW.id, c.id, CASE WHEN c.acesso_master THEN 'desenvolvedor' ELSE c.nivel_acesso END
  FROM public.colaboradores_importados c WHERE lower(c.email) = lower(NEW.email)
  ON CONFLICT (user_id) DO UPDATE SET colaborador_id = EXCLUDED.colaborador_id, role = EXCLUDED.role;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.seguranca_vincular_conta_colaborador() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER seguranca_vincular_conta_colaborador
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.seguranca_vincular_conta_colaborador();

-- Authorize only real, completed notice decisions, not arbitrary notifications.
CREATE FUNCTION public.seguranca_pode_notificar(destino text, tipo_aviso text, texto_aviso text, nome_ator text, foto_ator text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.seguranca_tem_papel(ARRAY['desenvolvedor','administrador','gestor'])
    AND EXISTS (
      SELECT 1 FROM public.user_roles r
      JOIN public.colaboradores_importados ator ON ator.id = r.colaborador_id
      JOIN public.avisos a ON lower(a.decidido_por_email) = lower(ator.email)
      WHERE r.user_id = (SELECT auth.uid())
        AND lower(a.solicitante_email) = lower(destino)
        AND EXISTS (SELECT 1 FROM public.colaboradores_importados destinatario WHERE lower(destinatario.email) = lower(destino))
        AND a.status IN ('aprovado', 'recusado')
        AND tipo_aviso = CASE a.status WHEN 'aprovado' THEN 'aviso_permitido' ELSE 'aviso_negado' END
        AND texto_aviso = CASE a.status WHEN 'aprovado' THEN 'permitiu sua solicitação de ' ELSE 'negou sua solicitação de ' END
          || CASE a.tipo WHEN 'hora_extra' THEN 'Aviso de Horas Extra' WHEN 'ausencia' THEN 'Aviso de Ausência' WHEN 'retrabalho' THEN 'Aviso de Retrabalho' END
        AND nome_ator IN (ator.nome, ator.nome_completo)
        AND (foto_ator IS NULL OR foto_ator = ator.foto_url)
    );
$$;
REVOKE ALL ON FUNCTION public.seguranca_pode_notificar(text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seguranca_pode_notificar(text,text,text,text,text) TO authenticated, service_role;

ALTER POLICY "authenticated can read cargos" ON public.cargos TO authenticated USING ((SELECT public.seguranca_administracao()));
ALTER POLICY "authenticated can insert cargos" ON public.cargos TO authenticated WITH CHECK ((SELECT public.seguranca_administracao()));
ALTER POLICY "authenticated can update cargos" ON public.cargos TO authenticated USING ((SELECT public.seguranca_administracao())) WITH CHECK ((SELECT public.seguranca_administracao()));
ALTER POLICY "authenticated can delete cargos" ON public.cargos TO authenticated USING ((SELECT public.seguranca_administracao()));
ALTER POLICY "authenticated can read cargo_senioridades" ON public.cargo_senioridades TO authenticated USING ((SELECT public.seguranca_administracao()));
ALTER POLICY "authenticated can insert cargo_senioridades" ON public.cargo_senioridades TO authenticated WITH CHECK ((SELECT public.seguranca_administracao()));
ALTER POLICY "authenticated can update cargo_senioridades" ON public.cargo_senioridades TO authenticated USING ((SELECT public.seguranca_administracao())) WITH CHECK ((SELECT public.seguranca_administracao()));
ALTER POLICY "authenticated can delete cargo_senioridades" ON public.cargo_senioridades TO authenticated USING ((SELECT public.seguranca_administracao()));
ALTER POLICY "authenticated can read setores" ON public.setores TO authenticated USING ((SELECT public.seguranca_membro_interno()));
ALTER POLICY "authenticated can insert setores" ON public.setores TO authenticated WITH CHECK ((SELECT public.seguranca_administracao()));
ALTER POLICY "authenticated can update setores" ON public.setores TO authenticated USING ((SELECT public.seguranca_administracao())) WITH CHECK ((SELECT public.seguranca_administracao()));
ALTER POLICY "authenticated can delete setores" ON public.setores TO authenticated USING ((SELECT public.seguranca_administracao()));
ALTER POLICY "authenticated can read colaboradores_importados" ON public.colaboradores_importados TO authenticated USING ((SELECT public.seguranca_membro_interno()) OR id IN (SELECT colaborador_id FROM public.user_roles WHERE user_id = (SELECT auth.uid())));
ALTER POLICY "authenticated can insert colaboradores_importados" ON public.colaboradores_importados TO authenticated WITH CHECK ((SELECT public.seguranca_administracao()));
ALTER POLICY "authenticated can update colaboradores_importados" ON public.colaboradores_importados TO authenticated USING ((SELECT public.seguranca_administracao())) WITH CHECK ((SELECT public.seguranca_administracao()));
ALTER POLICY "authenticated can delete colaboradores_importados" ON public.colaboradores_importados TO authenticated USING ((SELECT public.seguranca_administracao()));
ALTER POLICY "reconhecimentos: leitura autenticados" ON public.reconhecimentos TO authenticated USING ((SELECT public.seguranca_membro_interno()));
ALTER POLICY "reconhecimento_mencoes: leitura autenticados" ON public.reconhecimento_mencoes TO authenticated USING ((SELECT public.seguranca_membro_interno()));
ALTER POLICY "reconhecimento_curtidas: leitura autenticados" ON public.reconhecimento_curtidas TO authenticated USING ((SELECT public.seguranca_membro_interno()));
ALTER POLICY "reconhecimento_comentarios: leitura autenticados" ON public.reconhecimento_comentarios TO authenticated USING ((SELECT public.seguranca_membro_interno()));
ALTER POLICY "authenticated can read historico_ranking_mensal" ON public.historico_ranking_mensal TO authenticated USING ((SELECT public.seguranca_membro_interno()));
ALTER POLICY "authenticated le checkins" ON public.checkin_sentimento TO authenticated USING (public.seguranca_le_registro_pessoal(colaborador_email));
ALTER POLICY "authenticated le respostas de pesquisa" ON public.respostas_pesquisa TO authenticated USING (public.seguranca_le_registro_pessoal(colaborador_email));
ALTER POLICY "ferias programadas: leitura" ON public.ferias_programadas TO authenticated USING (public.seguranca_le_registro_pessoal(colaborador_email));
ALTER POLICY "mobile_entries_read" ON public.inventory_mobile_entries TO authenticated USING (((created_by = (SELECT auth.uid())) AND (SELECT public.seguranca_membro_interno())) OR (SELECT public.seguranca_administracao()));
ALTER POLICY "mobile_entries_delete" ON public.inventory_mobile_entries TO authenticated USING (((created_by = (SELECT auth.uid())) AND (SELECT public.seguranca_membro_interno())) OR (SELECT public.seguranca_administracao()));
ALTER POLICY "authenticated can read vagas" ON public.vagas TO authenticated USING ((SELECT public.seguranca_administracao()));
ALTER POLICY "authenticated can insert vagas" ON public.vagas TO authenticated WITH CHECK ((SELECT public.seguranca_administracao()));
ALTER POLICY "authenticated pode criar notificacoes" ON public.notificacoes TO authenticated WITH CHECK (public.seguranca_pode_notificar(destinatario_email, tipo, texto, ator_nome, ator_foto_url) AND NOT lida);
ALTER POLICY "feriados cadastrados: leitura" ON public.feriados_cadastrados TO authenticated USING ((SELECT public.seguranca_membro_interno()));
