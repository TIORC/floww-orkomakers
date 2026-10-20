import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

// A tipagem gerada do banco ainda não inclui a tabela setores.
const db = supabase as unknown as SupabaseClient<any>;

export type Setor = {
  id: string;
  nome: string;
  sigla: string;
};

export async function listarSetoresCompletos(): Promise<Setor[]> {
  const { data, error } = await db
    .from("setores")
    .select("id, nome, sigla")
    .order("nome", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((item: Record<string, string>) => ({
    id: String(item["id"]),
    nome: String(item["nome"] ?? ""),
    sigla: String(item["sigla"] ?? ""),
  }));
}

// Colaboradores e cargos guardam o nome do setor como texto. Ao renomear um setor,
// esse nome é trocado também nessas tabelas, para ninguém ficar com o setor antigo.
export async function salvarSetor(id: string | null, dados: { nome: string; sigla: string }, nomeAnterior?: string) {
  const nome = dados.nome.trim();
  const registro = { nome, sigla: dados.sigla.trim().toUpperCase() };

  if (!id) {
    const { error } = await db.from("setores").insert(registro);
    if (error) throw error;
    return;
  }

  const { error } = await db.from("setores").update(registro).eq("id", id);
  if (error) throw error;

  if (nomeAnterior && nomeAnterior !== nome) {
    const { error: erroColaboradores } = await db
      .from("colaboradores_importados")
      .update({ departamento: nome })
      .eq("departamento", nomeAnterior);
    if (erroColaboradores) throw erroColaboradores;

    const { error: erroCargos } = await db.from("cargos").update({ setor: nome }).eq("setor", nomeAnterior);
    if (erroCargos) throw erroCargos;
  }
}

export async function excluirSetor(id: string) {
  const { error } = await db.from("setores").delete().eq("id", id);
  if (error) throw error;
}
