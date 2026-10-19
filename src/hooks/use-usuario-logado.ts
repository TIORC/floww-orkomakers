import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

// A tipagem gerada do banco ainda não inclui colaboradores_importados.
const db = supabase as unknown as SupabaseClient<any>;

export type UsuarioLogado = {
  nome: string;
  nomeCompleto: string;
  setor: string;
};

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
        .select("nome, nome_completo, departamento")
        .eq("email", email)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        nome: data.nome,
        nomeCompleto: data.nome_completo || data.nome,
        setor: data.departamento,
      };
    },
  });
}
