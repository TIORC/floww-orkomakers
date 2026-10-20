import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { aplicarSomenteAtivos } from "@/lib/desligamento";

// A tipagem gerada do banco ainda não inclui colaboradores_importados.
const db = supabase as unknown as SupabaseClient<any>;

export const CARTOES_POR_PAGINA = 24;

export type FiltrosDiretorio = {
  busca: string;
  unidade: string;
  departamento: string;
  papel: string;
};

export type ColaboradorDiretorio = {
  id: string;
  nome: string;
  email: string;
  cargoVisivel: string;
  departamento: string;
  fotoUrl: string;
};

export type PaginaDiretorio = { itens: ColaboradorDiretorio[]; total: number };

// Remove caracteres que quebram o filtro do PostgREST e os curingas do LIKE.
function termoDeBusca(busca: string) {
  return busca.replace(/[,()*%_\\]/g, " ").trim();
}

// Diretório: colaboradores ativos, com filtros e busca feitos no banco.
export async function listarDiretorio(pagina: number, filtros: FiltrosDiretorio): Promise<PaginaDiretorio> {
  const termo = termoDeBusca(filtros.busca);
  const inicio = pagina * CARTOES_POR_PAGINA;

  let consulta = aplicarSomenteAtivos(
    db
      .from("colaboradores_importados")
      .select("id, nome, email, cargo_visivel, cargo, departamento, foto_url", { count: "exact" })
      .order("nome", { ascending: true })
      .order("id", { ascending: true })
      .range(inicio, inicio + CARTOES_POR_PAGINA - 1),
  );

  if (termo) {
    consulta = consulta.or(
      `nome.ilike.%${termo}%,cargo_visivel.ilike.%${termo}%,cargo.ilike.%${termo}%,departamento.ilike.%${termo}%`,
    );
  }
  if (filtros.unidade) consulta = consulta.eq("unidade", filtros.unidade);
  if (filtros.departamento) consulta = consulta.eq("departamento", filtros.departamento);
  if (filtros.papel) consulta = consulta.eq("papel", filtros.papel);

  const { data, error, count } = await consulta;
  if (error) throw error;

  const itens: ColaboradorDiretorio[] = (data ?? []).map((item: Record<string, string | null>) => ({
    id: item["id"] ?? "",
    nome: item["nome"] ?? "",
    email: item["email"] ?? "",
    cargoVisivel: item["cargo_visivel"] || item["cargo"] || "",
    departamento: item["departamento"] ?? "",
    fotoUrl: item["foto_url"] ?? "",
  }));
  return { itens, total: count ?? 0 };
}

export type OpcoesDiretorio = {
  unidades: string[];
  departamentos: string[];
  papeis: string[];
};

// Valores distintos para os filtros. Lê só as três colunas, página a página.
export async function listarOpcoesDiretorio(): Promise<OpcoesDiretorio> {
  const unidades = new Set<string>();
  const departamentos = new Set<string>();
  const papeis = new Set<string>();
  const TAMANHO = 1000;
  for (let inicio = 0; ; inicio += TAMANHO) {
    const { data, error } = await db
      .from("colaboradores_importados")
      .select("id, unidade, departamento, papel")
      .order("id", { ascending: true })
      .range(inicio, inicio + TAMANHO - 1);
    if (error) throw error;
    const lote = data ?? [];
    lote.forEach((item: Record<string, string | null>) => {
      if (item["unidade"]) unidades.add(item["unidade"]);
      if (item["departamento"]) departamentos.add(item["departamento"]);
      if (item["papel"]) papeis.add(item["papel"]);
    });
    if (lote.length < TAMANHO) break;
  }
  const ordenar = (valores: Set<string>) => [...valores].sort((a, b) => a.localeCompare(b, "pt-BR"));
  return { unidades: ordenar(unidades), departamentos: ordenar(departamentos), papeis: ordenar(papeis) };
}
