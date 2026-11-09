import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import type { FeriadoCadastrado, TipoFeriado } from "@/lib/feriados";

// A tipagem gerada do banco ainda não inclui feriados_cadastrados.
const db = supabase as unknown as SupabaseClient<any>;

// Todos os feriados cadastrados pelo RH, por nome.
export async function listarFeriadosCadastrados(): Promise<FeriadoCadastrado[]> {
  const { data, error } = await db
    .from("feriados_cadastrados")
    .select("id, nome, data, recorrente, tipo, abrangencia")
    .order("nome", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((linha: Record<string, unknown>) => ({
    id: String(linha["id"] ?? ""),
    nome: String(linha["nome"] ?? ""),
    data: String(linha["data"] ?? ""),
    recorrente: Boolean(linha["recorrente"]),
    tipo: linha["tipo"] as TipoFeriado,
    abrangencia: String(linha["abrangencia"] ?? ""),
  }));
}

export type DadosFeriado = Omit<FeriadoCadastrado, "id">;

// Grava um feriado novo ou altera um existente (quando `id` é informado). Regra de quem pode gravar fica no banco.
export async function salvarFeriadoCadastrado(dados: DadosFeriado & { id?: string; quemEmail: string }) {
  const campos = {
    nome: dados.nome,
    data: dados.data,
    recorrente: dados.recorrente,
    tipo: dados.tipo,
    abrangencia: dados.abrangencia,
    atualizado_em: new Date().toISOString(),
  };
  if (dados.id) {
    const { error } = await db.from("feriados_cadastrados").update(campos).eq("id", dados.id);
    if (error) throw error;
    return;
  }
  const { error } = await db
    .from("feriados_cadastrados")
    .insert({ ...campos, criado_por_email: dados.quemEmail });
  if (error) throw error;
}

export async function removerFeriadoCadastrado(id: string) {
  const { error } = await db.from("feriados_cadastrados").delete().eq("id", id);
  if (error) throw error;
}
