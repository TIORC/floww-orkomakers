import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

// A tipagem gerada do banco ainda não inclui historico_ranking_mensal.
const db = supabase as unknown as SupabaseClient<any>;

// Quantos meses finalizados mostrar de uma vez.
const MESES_POR_CONSULTA = 12;

export type VencedorMes = {
  posicao: number;
  nome: string;
  setor: string;
  fotoUrl: string;
  pontos: number;
};

export type MesRanking = {
  ano: number;
  mes: number;
  meta: number;
  vencedores: VencedorMes[];
};

// Histórico dos meses já finalizados, do mais recente para o mais antigo, com o top 3 de cada um.
export async function listarHistoricoRanking(): Promise<MesRanking[]> {
  const { data, error } = await db
    .from("historico_ranking_mensal")
    .select("ano, mes, posicao, nome, setor, foto_url, pontos, meta")
    .order("ano", { ascending: false })
    .order("mes", { ascending: false })
    .order("posicao", { ascending: true })
    .limit(MESES_POR_CONSULTA * 3);
  if (error) throw error;

  const meses = new Map<string, MesRanking>();
  (data ?? []).forEach((item: Record<string, string | number | null>) => {
    const ano = Number(item["ano"]);
    const mes = Number(item["mes"]);
    const chave = `${ano}-${mes}`;
    if (!meses.has(chave)) {
      meses.set(chave, { ano, mes, meta: Number(item["meta"] ?? 0), vencedores: [] });
    }
    meses.get(chave)?.vencedores.push({
      posicao: Number(item["posicao"]),
      nome: String(item["nome"] ?? ""),
      setor: String(item["setor"] ?? ""),
      fotoUrl: String(item["foto_url"] ?? ""),
      pontos: Number(item["pontos"] ?? 0),
    });
  });
  return [...meses.values()];
}

export const NOMES_MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
