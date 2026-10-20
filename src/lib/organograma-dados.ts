import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { aplicarSomenteAtivos, estaDesligado } from "@/lib/desligamento";
import type { PessoaOrganograma } from "@/lib/organograma";

// A tipagem gerada do banco ainda não inclui colaboradores_importados.
const db = supabase as unknown as SupabaseClient<any>;

const TAMANHO_PAGINA = 1000;

// Lê todos os colaboradores importados, página a página, sem os desligados.
export async function buscarPessoasOrganograma(): Promise<PessoaOrganograma[]> {
  const pessoas: PessoaOrganograma[] = [];

  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    const { data, error } = await db
      .from("colaboradores_importados")
      .select(
        "id, nome, email, cargo, cargo_visivel, departamento, gestor_direto_email, papel, foto_url, situacao, desligamento, ultimo_dia_trabalhado",
      )
      .order("nome", { ascending: true })
      .order("id", { ascending: true })
      .range(inicio, inicio + TAMANHO_PAGINA - 1);
    if (error) throw error;

    (data ?? [])
      .filter(
        (linha: Record<string, string | null>) =>
          !estaDesligado({
            situacao: linha["situacao"] ?? null,
            desligamento: linha["desligamento"] ?? null,
            ultimo_dia_trabalhado: linha["ultimo_dia_trabalhado"] ?? null,
          }),
      )
      .forEach((linha: Record<string, string | null>) => {
        pessoas.push({
          id: linha["id"] ?? "",
          nome: linha["nome"] ?? "",
          cargo: linha["cargo_visivel"] || linha["cargo"] || "",
          departamento: linha["departamento"] ?? "",
          email: linha["email"] ?? "",
          gestorEmail: linha["gestor_direto_email"] ?? "",
          papel: linha["papel"] ?? "",
          fotoUrl: linha["foto_url"] || null,
        });
      });

    if (!data || data.length < TAMANHO_PAGINA) break;
  }

  return pessoas;
}

export type PessoaGestor = { nome: string; email: string };

// Quem pode ser escolhido como gestor direto no cadastro (pessoas com e-mail cadastrado).
export async function listarPessoasParaGestor(): Promise<PessoaGestor[]> {
  const pessoas: PessoaGestor[] = [];
  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    const { data, error } = await aplicarSomenteAtivos(
      db
        .from("colaboradores_importados")
        .select("nome, email")
        .order("nome", { ascending: true })
        .order("id", { ascending: true })
        .range(inicio, inicio + TAMANHO_PAGINA - 1),
    );
    if (error) throw error;
    (data ?? []).forEach((linha: Record<string, string | null>) => {
      if (linha["email"]) pessoas.push({ nome: linha["nome"] ?? "", email: linha["email"] });
    });
    if (!data || data.length < TAMANHO_PAGINA) break;
  }
  return pessoas;
}

export type GestorDoSetor = { email: string; nome: string; cargo: string; setor: string; fotoUrl: string | null };

// Compara nomes de setor ignorando prefixo "Departamento", acentos, maiúsculas e pontuação.
// Ex.: "Departamento TI/Desenvolvimento" bate com "TI / Desenvolvimento".
function chaveSetor(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/departamento/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Gestores de um setor: colaboradores ativos com papel ou cargo de gestão/liderança
// cujo departamento corresponde ao setor (todos, se houver mais de um).
export async function listarGestoresDoSetor(setor: string): Promise<GestorDoSetor[]> {
  if (!setor) return [];
  const { data, error } = await aplicarSomenteAtivos(
    db
      .from("colaboradores_importados")
      .select("nome, email, cargo, cargo_visivel, departamento, papel, foto_url")
      .or("papel.ilike.%gestor%,papel.ilike.%líder%,papel.ilike.%lider%,cargo.ilike.%líder%,cargo.ilike.%lider%,cargo_visivel.ilike.%líder%,cargo_visivel.ilike.%lider%")
      .order("nome", { ascending: true }),
  );
  if (error) throw error;
  const alvo = chaveSetor(setor);
  return (data ?? [])
    .filter((linha: Record<string, string | null>) => {
      const dep = chaveSetor(linha["departamento"] ?? "");
      return dep !== "" && alvo !== "" && (dep === alvo || dep.includes(alvo) || alvo.includes(dep));
    })
    .map((linha: Record<string, string | null>) => ({
      email: linha["email"] ?? "",
      nome: linha["nome"] ?? "",
      cargo: linha["cargo_visivel"] || linha["cargo"] || "",
      setor: linha["departamento"] ?? "",
      fotoUrl: linha["foto_url"] || null,
    }));
}
