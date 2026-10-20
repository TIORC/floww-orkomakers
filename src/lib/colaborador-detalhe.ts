import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

// A tipagem gerada do banco ainda não inclui colaboradores_importados.
const db = supabase as unknown as SupabaseClient<any>;

export type RegistroColaborador = Record<string, string | null> & { id: string };

// Busca um colaborador completo pelo id ou pelo e-mail (usado para abrir o líder).
export async function buscarColaborador(
  identificador: { id: string } | { email: string },
): Promise<RegistroColaborador | null> {
  const consulta = db.from("colaboradores_importados").select("*");
  const { data, error } =
    "id" in identificador
      ? await consulta.eq("id", identificador.id).maybeSingle()
      : await consulta.ilike("email", identificador.email).maybeSingle();
  if (error) throw error;
  return data ?? null;
}

// Campos editáveis pela tela de detalhes. Cada chave é a coluna do banco.
export type CamposEditaveis = {
  nome: string;
  nome_completo: string;
  email: string;
  cargo: string;
  cargo_visivel: string;
  departamento: string;
  unidade: string;
  papel: string;
  situacao: string;
  gestor_direto: string;
  gestor_direto_email: string;
};

export async function atualizarColaborador(id: string, campos: CamposEditaveis) {
  const { error } = await db.from("colaboradores_importados").update(campos).eq("id", id);
  if (error) throw error;
}

// Desligamento: marca a situação como Desligado e registra o último dia trabalhado.
// A pessoa sai do organograma, do diretório e dos rankings, mas continua no banco.
export async function desligarColaborador(id: string, dataDesligamento: string) {
  const { error } = await db
    .from("colaboradores_importados")
    .update({
      situacao: "Desligado",
      desligamento: "Desligado",
      ultimo_dia_trabalhado: dataDesligamento,
    })
    .eq("id", id);
  if (error) throw error;
}
