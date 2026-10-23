import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

// A tipagem gerada do banco ainda não inclui colaboradores_importados.
const db = supabase as unknown as SupabaseClient<any>;

export type UsuarioLogado = {
  email: string;
  nome: string;
  nomeCompleto: string;
  setor: string;
  fotoUrl: string | null;
  acessoMaster: boolean;
  nivelAcesso: string;
  ouvidor: boolean;
  cargo: string;
  cargoVisivel: string;
  gestorDiretoEmail: string;
};

// Só a Ouvidora atual pode transferir o cargo de Ouvidor.
export function podeTransferirOuvidor(usuario: UsuarioLogado | null | undefined) {
  return Boolean(usuario?.ouvidor);
}

// Perfis que podem ler, editar e desligar colaboradores: Desenvolvedor do Sistema ou Administrador.
const REGRA_PERFIL_GESTAO = /desenvolvedor do sistema|administrador/i;

// Quem pode gerenciar colaboradores: conta master ou cargo de Desenvolvedor do Sistema / Administrador.
export function podeGerenciarColaboradores(usuario: UsuarioLogado | null | undefined) {
  if (!usuario) return false;
  return (
    usuario.acessoMaster ||
    REGRA_PERFIL_GESTAO.test(usuario.cargoVisivel) ||
    REGRA_PERFIL_GESTAO.test(usuario.cargo)
  );
}

// Quem pode alterar o papel de acesso das pessoas: Desenvolvedor do Sistema (conta mestre) ou Administrador.
export function podeAlterarPapeis(usuario: UsuarioLogado | null | undefined) {
  if (!usuario) return false;
  return (
    usuario.acessoMaster ||
    usuario.nivelAcesso === "desenvolvedor" ||
    usuario.nivelAcesso === "administrador"
  );
}

// Busca o colaborador do usuário logado pelo e-mail da conta.
export function useUsuarioLogado() {
  return useQuery<UsuarioLogado | null>({
    queryKey: ["usuario-logado"],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser();
      const email = authData.user?.email;
      if (!email) return null;

      const { data, error } = await db
        .from("colaboradores_importados")
        .select("nome, nome_completo, departamento, foto_url, acesso_master, nivel_acesso, ouvidor, cargo, cargo_visivel, gestor_direto_email")
        .eq("email", email)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        email,
        nome: data.nome,
        nomeCompleto: data.nome_completo || data.nome,
        setor: data.departamento,
        fotoUrl: data.foto_url || null,
        acessoMaster: Boolean(data.acesso_master),
        nivelAcesso: data.nivel_acesso ?? "colaborador",
        ouvidor: Boolean(data.ouvidor),
        cargo: data.cargo ?? "",
        cargoVisivel: data.cargo_visivel ?? "",
        gestorDiretoEmail: data.gestor_direto_email ?? "",
      };
    },
  });
}
