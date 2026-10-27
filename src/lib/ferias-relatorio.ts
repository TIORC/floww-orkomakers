import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

// A tipagem gerada do banco ainda não inclui as tabelas usadas aqui.
const db = supabase as unknown as SupabaseClient<any>;

export type LinhaRelatorioFerias = {
  nome: string;
  setor: string;
  cargo: string;
  liderDireto: string;
  inicio: string;
  fim: string;
  aquisitivoInicio: string;
  aquisitivoFim: string;
};

export type FiltroRelatorioFerias = { inicio?: string | undefined; fim?: string | undefined };

// Aceita DD/MM/AAAA (como vem da planilha) ou AAAA-MM-DD (ISO).
function lerData(texto: string): Date | null {
  const valor = texto.trim();
  if (!valor) return null;
  const brasil = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  const data = brasil
    ? new Date(Number(brasil[3]), Number(brasil[2]) - 1, Number(brasil[1]))
    : new Date(`${valor.slice(0, 10)}T00:00:00`);
  return Number.isNaN(data.getTime()) ? null : data;
}

function formatarData(data: Date): string {
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}/${data.getFullYear()}`;
}

function somarAnos(data: Date, anos: number): Date {
  return new Date(data.getFullYear() + anos, data.getMonth(), data.getDate());
}

// Período aquisitivo (CLT): cada 12 meses de casa dão direito às férias. Começa na admissão e
// vai de um aniversário de admissão ao dia anterior ao próximo. Devolve o período em que `inicioFerias` cai.
export function periodoAquisitivoDe(
  admissao: Date,
  inicioFerias: Date,
): { inicio: string; fim: string } | null {
  let anos = inicioFerias.getFullYear() - admissao.getFullYear();
  if (somarAnos(admissao, anos) > inicioFerias) anos -= 1;
  if (anos < 0) return null;

  const inicio = somarAnos(admissao, anos);
  const proximo = somarAnos(admissao, anos + 1);
  const fim = new Date(proximo.getFullYear(), proximo.getMonth(), proximo.getDate() - 1);
  return { inicio: formatarData(inicio), fim: formatarData(fim) };
}

// Férias programadas que caem no intervalo (ou em qualquer data, se o filtro vier vazio), com setor, cargo,
// líder direto e o período aquisitivo de cada uma. Só lê dados; não altera nada.
export async function buscarRelatorioFerias(filtro: FiltroRelatorioFerias): Promise<LinhaRelatorioFerias[]> {
  let consulta = db
    .from("ferias_programadas")
    .select("colaborador_email, colaborador_nome, inicio, fim")
    .order("inicio", { ascending: true });
  // Mostra as férias que tocam o intervalo: começam antes do fim e terminam depois do início.
  if (filtro.inicio) consulta = consulta.gte("fim", filtro.inicio);
  if (filtro.fim) consulta = consulta.lte("inicio", filtro.fim);

  const { data: ferias, error } = await consulta;
  if (error) throw error;
  const linhas = (ferias ?? []) as Record<string, string>[];
  if (linhas.length === 0) return [];

  const emails = [...new Set(linhas.map((linha) => linha["colaborador_email"] ?? "").filter(Boolean))];
  const { data: pessoas, error: erroPessoas } = await db
    .from("colaboradores_importados")
    .select("email, nome, departamento, cargo_visivel, cargo, gestor_direto, data_admissao")
    .in("email", emails);
  if (erroPessoas) throw erroPessoas;

  const porEmail = new Map<string, Record<string, string | null>>();
  for (const pessoa of (pessoas ?? []) as Record<string, string | null>[]) {
    porEmail.set((pessoa["email"] ?? "").toLowerCase(), pessoa);
  }

  return linhas.map((linha) => {
    const pessoa = porEmail.get((linha["colaborador_email"] ?? "").toLowerCase()) ?? {};
    const admissao = lerData(pessoa["data_admissao"] ?? "");
    const inicio = lerData(linha["inicio"] ?? "");
    const aquisitivo = admissao && inicio ? periodoAquisitivoDe(admissao, inicio) : null;
    return {
      nome: pessoa["nome"] || linha["colaborador_nome"] || "",
      setor: pessoa["departamento"] || "",
      cargo: pessoa["cargo_visivel"] || pessoa["cargo"] || "",
      liderDireto: pessoa["gestor_direto"] || "",
      inicio: inicio ? formatarData(inicio) : linha["inicio"] ?? "",
      fim: lerData(linha["fim"] ?? "") ? formatarData(lerData(linha["fim"] ?? "")!) : linha["fim"] ?? "",
      aquisitivoInicio: aquisitivo?.inicio ?? "",
      aquisitivoFim: aquisitivo?.fim ?? "",
    };
  });
}
