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

export type ColaboradorDoSetor = ColaboradorDiretorio & {
  nivelAcesso: string;
  gestorEmail: string;
  dataAdmissao: string;
  subliderArea: string;
};

// Separa o líder da equipe. Líder é quem tem o nível de acesso Gestor no setor; se ninguém tem, vale o gestor
// direto mais comum entre as pessoas do setor (quando ele próprio está no setor).
export function separarLideres(colaboradores: ColaboradorDoSetor[]): {
  lideres: ColaboradorDoSetor[];
  equipe: ColaboradorDoSetor[];
} {
  let lideres = colaboradores.filter((c) => c.nivelAcesso === "gestor");

  if (lideres.length === 0) {
    const contagem = new Map<string, number>();
    for (const c of colaboradores) {
      const email = c.gestorEmail.trim().toLowerCase();
      if (email) contagem.set(email, (contagem.get(email) ?? 0) + 1);
    }
    const maisComum = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (maisComum) lideres = colaboradores.filter((c) => c.email.trim().toLowerCase() === maisComum);
  }

  const ids = new Set(lideres.map((l) => l.id));
  return { lideres, equipe: colaboradores.filter((c) => !ids.has(c.id)) };
}

// Todos os colaboradores ativos de um setor, em ordem de nome. Sem paginação: o setor inteiro aparece de uma vez.
// `departamentos` são todas as grafias do setor (ex.: "TI" e "Departamento TI/Desenvolvimento").
export async function listarColaboradoresDoSetor(departamentos: string[]): Promise<ColaboradorDoSetor[]> {
  return buscarColaboradoresAtivos((consulta) => consulta.in("departamento", departamentos));
}

// Subordinados diretos de quem tem este e-mail como gestor, em ordem de nome.
export async function listarEquipeDireta(emailGestor: string): Promise<ColaboradorDoSetor[]> {
  return buscarColaboradoresAtivos((consulta) =>
    consulta.eq("gestor_direto_email", emailGestor),
  );
}

async function buscarColaboradoresAtivos(
  filtrar: (consulta: any) => any,
): Promise<ColaboradorDoSetor[]> {
  const TAMANHO = 1000;
  const itens: ColaboradorDoSetor[] = [];
  for (let inicio = 0; ; inicio += TAMANHO) {
    const { data, error } = await aplicarSomenteAtivos(
      filtrar(
        db
          .from("colaboradores_importados")
          .select("id, nome, email, cargo_visivel, cargo, departamento, foto_url, nivel_acesso, gestor_direto_email, data_admissao, sublider_area")
          .order("nome", { ascending: true })
          .order("id", { ascending: true })
          .range(inicio, inicio + TAMANHO - 1),
      ),
    );
    if (error) throw error;
    const lote = data ?? [];
    for (const item of lote as Record<string, string | null>[]) {
      itens.push({
        id: item["id"] ?? "",
        nome: item["nome"] ?? "",
        email: item["email"] ?? "",
        cargoVisivel: item["cargo_visivel"] || item["cargo"] || "",
        departamento: item["departamento"] ?? "",
        fotoUrl: item["foto_url"] ?? "",
        nivelAcesso: item["nivel_acesso"] ?? "colaborador",
        gestorEmail: item["gestor_direto_email"] ?? "",
        dataAdmissao: item["data_admissao"] ?? "",
        subliderArea: item["sublider_area"] ?? "",
      });
    }
    if (lote.length < TAMANHO) return itens;
  }
}

// Todos os colaboradores ativos, em ordem de nome (para listas como a de quem está online).
export async function listarTodosColaboradores(): Promise<ColaboradorDiretorio[]> {
  const TAMANHO = 1000;
  const itens: ColaboradorDiretorio[] = [];
  for (let inicio = 0; ; inicio += TAMANHO) {
    const { data, error } = await aplicarSomenteAtivos(
      db
        .from("colaboradores_importados")
        .select("id, nome, email, cargo_visivel, cargo, departamento, foto_url")
        .order("nome", { ascending: true })
        .order("id", { ascending: true })
        .range(inicio, inicio + TAMANHO - 1),
    );
    if (error) throw error;
    const lote = (data ?? []) as Record<string, string | null>[];
    for (const item of lote) {
      itens.push({
        id: item["id"] ?? "",
        nome: item["nome"] ?? "",
        email: item["email"] ?? "",
        cargoVisivel: item["cargo_visivel"] || item["cargo"] || "",
        departamento: item["departamento"] ?? "",
        fotoUrl: item["foto_url"] ?? "",
      });
    }
    if (lote.length < TAMANHO) return itens;
  }
}
