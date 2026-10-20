import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

// A tipagem gerada do banco ainda não inclui cargos, cargo_senioridades e setores.
const db = supabase as unknown as SupabaseClient<any>;

export type Senioridade = {
  id: string;
  nivel: string;
  faixaMinima: number;
  salarioBase: number;
  faixaMaxima: number;
};

export type Cargo = {
  id: string;
  nome: string;
  cbo: string;
  setor: string;
  senioridades: Senioridade[];
};

export type DadosCargo = {
  nome: string;
  cbo: string;
  setor: string;
};

export type DadosSenioridade = Omit<Senioridade, "id">;

// Cargos com as senioridades, do mais recente para o mais antigo.
export async function listarCargos(): Promise<Cargo[]> {
  const { data, error } = await db
    .from("cargos")
    .select("id, nome, cbo, setor, cargo_senioridades(id, nivel, faixa_minima, salario_base, faixa_maxima, ordem)")
    .order("nome", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((item: Record<string, unknown>) => {
    const senioridades = (item["cargo_senioridades"] as Record<string, unknown>[] | null) ?? [];
    return {
      id: String(item["id"]),
      nome: String(item["nome"] ?? ""),
      cbo: String(item["cbo"] ?? ""),
      setor: String(item["setor"] ?? ""),
      senioridades: [...senioridades]
        .sort((a, b) => Number(a["ordem"] ?? 0) - Number(b["ordem"] ?? 0))
        .map((senioridade) => ({
          id: String(senioridade["id"]),
          nivel: String(senioridade["nivel"] ?? ""),
          faixaMinima: Number(senioridade["faixa_minima"] ?? 0),
          salarioBase: Number(senioridade["salario_base"] ?? 0),
          faixaMaxima: Number(senioridade["faixa_maxima"] ?? 0),
        })),
    };
  });
}

// Cria ou atualiza o cargo e substitui as senioridades dele pelas informadas.
export async function salvarCargo(id: string | null, dados: DadosCargo, senioridades: DadosSenioridade[]) {
  let cargoId = id;
  const registro = { nome: dados.nome, cbo: dados.cbo, setor: dados.setor, atualizado_em: new Date().toISOString() };

  if (cargoId) {
    const { error } = await db.from("cargos").update(registro).eq("id", cargoId);
    if (error) throw error;
  } else {
    const { data, error } = await db.from("cargos").insert(registro).select("id").single();
    if (error) throw error;
    cargoId = String(data.id);
  }

  // Substitui as senioridades: remove as antigas e grava as da tela na ordem informada.
  const { error: erroRemover } = await db.from("cargo_senioridades").delete().eq("cargo_id", cargoId);
  if (erroRemover) throw erroRemover;

  if (senioridades.length > 0) {
    const { error: erroInserir } = await db.from("cargo_senioridades").insert(
      senioridades.map((senioridade, ordem) => ({
        cargo_id: cargoId,
        nivel: senioridade.nivel,
        faixa_minima: senioridade.faixaMinima,
        salario_base: senioridade.salarioBase,
        faixa_maxima: senioridade.faixaMaxima,
        ordem,
      })),
    );
    if (erroInserir) throw erroInserir;
  }
}

export async function excluirCargo(id: string) {
  const { error } = await db.from("cargos").delete().eq("id", id);
  if (error) throw error;
}

export async function listarSetores(): Promise<string[]> {
  const { data, error } = await db.from("setores").select("nome").order("nome", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((setor: { nome: string }) => setor.nome);
}
