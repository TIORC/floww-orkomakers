import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { aplicarSomenteAtivos } from "@/lib/desligamento";

// A tipagem gerada do banco ainda não inclui colaboradores_importados.
const db = supabase as unknown as SupabaseClient<any>;

const TAMANHO_PAGINA = 1000;

export const CORES_MOTIVOS = [
  "oklch(0.82 0.16 80)",
  "oklch(0.7 0.14 200)",
  "oklch(0.68 0.18 25)",
  "oklch(0.72 0.15 145)",
  "oklch(0.65 0.14 300)",
  "oklch(0.8 0.1 110)",
  "oklch(0.75 0.12 40)",
  "oklch(0.62 0.16 330)",
  "oklch(0.78 0.12 230)",
];

export const COR_OUTROS = "oklch(0.6 0.02 260)";

export const QUANTIDADE_MOTIVOS_DESTAQUE = 8;

export type MotivoTurnover = { motivo: string; quantidade: number };

// Conta os desligamentos por motivo. O campo "desligamento" guarda o texto como veio da planilha
// (tipo e motivo juntados por " - "), então a contagem usa o valor completo.
export async function buscarTurnoverPorMotivo(): Promise<MotivoTurnover[]> {
  const contagem = new Map<string, number>();

  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    const { data, error } = await db
      .from("colaboradores_importados")
      .select("desligamento")
      .not("desligamento", "is", null)
      .neq("desligamento", "")
      .order("id", { ascending: true })
      .range(inicio, inicio + TAMANHO_PAGINA - 1);
    if (error) throw error;

    for (const linha of (data ?? []) as { desligamento: string }[]) {
      const motivo = linha.desligamento.trim();
      if (motivo) contagem.set(motivo, (contagem.get(motivo) ?? 0) + 1);
    }

    if (!data || data.length < TAMANHO_PAGINA) break;
  }

  return [...contagem.entries()]
    .map(([motivo, quantidade]) => ({ motivo, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade);
}

// Remove o tipo (tudo antes do primeiro " - "), deixando só o nome do motivo.
export function nomeDoMotivo(desligamento: string): string {
  const separador = desligamento.indexOf(" - ");
  return separador < 0 ? desligamento.trim() : desligamento.slice(separador + 3).trim();
}

// Soma os desligamentos pelo nome do motivo, sem o tipo. Tipos diferentes com o mesmo motivo viram uma fatia só.
export function agruparPorNomeDoMotivo(motivos: MotivoTurnover[]): MotivoTurnover[] {
  const contagem = new Map<string, number>();

  for (const { motivo, quantidade } of motivos) {
    const nome = nomeDoMotivo(motivo);
    contagem.set(nome, (contagem.get(nome) ?? 0) + quantidade);
  }

  return [...contagem.entries()]
    .map(([motivo, quantidade]) => ({ motivo, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade);
}

export type DepartamentoTurnover = { departamento: string; quantidade: number };

export type TurnoverPorDepartamento = { departamentos: DepartamentoTurnover[]; total: number };

// Conta os desligamentos por departamento. O total inclui quem não tem departamento preenchido,
// para que as porcentagens sejam sobre todos os desligamentos.
export async function buscarTurnoverPorDepartamento(): Promise<TurnoverPorDepartamento> {
  const contagem = new Map<string, number>();
  let total = 0;

  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    const { data, error } = await db
      .from("colaboradores_importados")
      .select("departamento, desligamento")
      .not("desligamento", "is", null)
      .neq("desligamento", "")
      .order("id", { ascending: true })
      .range(inicio, inicio + TAMANHO_PAGINA - 1);
    if (error) throw error;

    for (const linha of (data ?? []) as { departamento: string | null }[]) {
      const departamento = linha.departamento?.trim() ?? "";
      total += 1;
      if (departamento) contagem.set(departamento, (contagem.get(departamento) ?? 0) + 1);
    }

    if (!data || data.length < TAMANHO_PAGINA) break;
  }

  const departamentos = [...contagem.entries()]
    .map(([departamento, quantidade]) => ({ departamento, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade);

  return { departamentos, total };
}

export type ConsolidadoTurnover = {
  totalDesligamentos: number;
  mediaAtivos: number;
  taxaTurnover: number;
};

// Consolidado geral, sem recorte de datas: todos os colaboradores cadastrados entram como base.
// A média de ativos é (início + fim) / 2, com início = ativos + desligados e fim = ativos.
// A taxa é desligados / média de ativos, em porcentagem.
export async function buscarConsolidadoTurnover(): Promise<ConsolidadoTurnover> {
  const [todos, ativos] = await Promise.all([
    db.from("colaboradores_importados").select("id", { count: "exact", head: true }),
    aplicarSomenteAtivos(
      db.from("colaboradores_importados").select("id", { count: "exact", head: true }),
    ),
  ]);
  if (todos.error) throw todos.error;
  if (ativos.error) throw ativos.error;

  const totalDesligamentos = (todos.count ?? 0) - (ativos.count ?? 0);
  const mediaAtivos = (ativos.count ?? 0) + totalDesligamentos / 2;
  const taxaTurnover = mediaAtivos > 0 ? (totalDesligamentos / mediaAtivos) * 100 : 0;

  return { totalDesligamentos, mediaAtivos, taxaTurnover };
}

export type PontoTurnoverPeriodo = { periodo: string; taxa: number | null };

const MESES_CURTOS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

// Data de admissão ausente ou ilegível: a pessoa conta como já admitida antes de qualquer período.
const ADMISSAO_ANTIGA = new Date(1900, 0, 1);

// As datas são texto. Aceita dd/mm/aaaa, d/m/aa, aaaa-mm-dd (com ou sem horário) e número de série do Excel.
function lerData(texto: string | null): Date | null {
  if (!texto) return null;
  const valor = texto.trim();
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})(?:\s.*)?$/.exec(valor);
  if (br) {
    const ano = Number(br[3]) < 100 ? 2000 + Number(br[3]) : Number(br[3]);
    return new Date(ano, Number(br[2]) - 1, Number(br[1]));
  }
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/.exec(valor);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  if (/^\d{4,6}(\.\d+)?$/.test(valor)) {
    const serial = new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(valor)) * 86400000);
    return new Date(serial.getUTCFullYear(), serial.getUTCMonth(), serial.getUTCDate());
  }
  return null;
}

// Taxa por mês nos últimos `quantidadeMeses`, terminando no mês atual.
// Taxa do mês = desligados no mês / média de ativos do mês, em porcentagem.
// Média = (ativos no início do mês + ativos no fim do mês) / 2, usando data de admissão e último dia.
// Quem não tem último dia trabalhado é tratado como ativo. Sem data de admissão legível, conta como admitido antes.
export async function buscarTaxaTurnoverPorPeriodo(
  quantidadeMeses = 12,
): Promise<PontoTurnoverPeriodo[]> {
  const pessoas: { admissao: Date; ultimoDia: Date | null }[] = [];

  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    const { data, error } = await db
      .from("colaboradores_importados")
      .select("data_admissao, ultimo_dia_trabalhado")
      .order("id", { ascending: true })
      .range(inicio, inicio + TAMANHO_PAGINA - 1);
    if (error) throw error;

    for (const linha of (data ?? []) as {
      data_admissao: string | null;
      ultimo_dia_trabalhado: string | null;
    }[]) {
      pessoas.push({
        admissao: lerData(linha.data_admissao) ?? ADMISSAO_ANTIGA,
        ultimoDia: lerData(linha.ultimo_dia_trabalhado),
      });
    }

    if (!data || data.length < TAMANHO_PAGINA) break;
  }

  const hoje = new Date();
  const serie: PontoTurnoverPeriodo[] = [];

  for (let deslocamento = quantidadeMeses - 1; deslocamento >= 0; deslocamento--) {
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth() - deslocamento, 1);
    const fimMes = new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 0);
    const rotulo = `${MESES_CURTOS[inicioMes.getMonth()]}/${String(inicioMes.getFullYear()).slice(2)}`;

    let desligadosNoMes = 0;
    let ativosInicio = 0;
    let ativosFim = 0;

    for (const { admissao, ultimoDia } of pessoas) {
      if (ultimoDia && ultimoDia >= inicioMes && ultimoDia <= fimMes) desligadosNoMes += 1;
      if (admissao < inicioMes && (!ultimoDia || ultimoDia >= inicioMes)) ativosInicio += 1;
      if (admissao <= fimMes && (!ultimoDia || ultimoDia > fimMes)) ativosFim += 1;
    }

    const media = (ativosInicio + ativosFim) / 2;
    serie.push({ periodo: rotulo, taxa: media > 0 ? (desligadosNoMes / media) * 100 : null });
  }

  return serie;
}

export type DesligamentosMes = { periodo: string; quantidade: number };

// Quantidade de desligamentos em cada mês dos últimos `quantidadeMeses`, terminando no mês atual.
// Conta pelo último dia trabalhado; quem não tem essa data não entra em nenhum mês.
export async function buscarDesligamentosPorMes(quantidadeMeses = 12): Promise<DesligamentosMes[]> {
  const datas: Date[] = [];

  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    const { data, error } = await db
      .from("colaboradores_importados")
      .select("ultimo_dia_trabalhado")
      .not("ultimo_dia_trabalhado", "is", null)
      .neq("ultimo_dia_trabalhado", "")
      .order("id", { ascending: true })
      .range(inicio, inicio + TAMANHO_PAGINA - 1);
    if (error) throw error;

    for (const linha of (data ?? []) as { ultimo_dia_trabalhado: string | null }[]) {
      const data = lerData(linha.ultimo_dia_trabalhado);
      if (data) datas.push(data);
    }

    if (!data || data.length < TAMANHO_PAGINA) break;
  }

  const hoje = new Date();
  const serie: DesligamentosMes[] = [];

  for (let deslocamento = quantidadeMeses - 1; deslocamento >= 0; deslocamento--) {
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth() - deslocamento, 1);
    const fimMes = new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 0);
    const quantidade = datas.filter((data) => data >= inicioMes && data <= fimMes).length;
    const rotulo = `${MESES_CURTOS[inicioMes.getMonth()]}/${String(inicioMes.getFullYear()).slice(2)}`;
    serie.push({ periodo: rotulo, quantidade });
  }

  return serie;
}

export type LinhaHistorico = {
  nome: string;
  setor: string;
  cargo: string;
  motivo: string;
};

// Lista de todos os desligados (mesmo critério dos gráficos), em ordem alfabética.
export async function buscarHistoricoDesligamentos(): Promise<LinhaHistorico[]> {
  const linhas: LinhaHistorico[] = [];

  for (let inicio = 0; ; inicio += TAMANHO_PAGINA) {
    const { data, error } = await db
      .from("colaboradores_importados")
      .select("nome_completo, nome, departamento, cargo, cargo_visivel, desligamento")
      .not("desligamento", "is", null)
      .neq("desligamento", "")
      .order("nome_completo", { ascending: true })
      .order("id", { ascending: true })
      .range(inicio, inicio + TAMANHO_PAGINA - 1);
    if (error) throw error;

    for (const item of (data ?? []) as {
      nome_completo: string | null;
      nome: string | null;
      departamento: string | null;
      cargo: string | null;
      cargo_visivel: string | null;
      desligamento: string;
    }[]) {
      linhas.push({
        nome: item.nome_completo || item.nome || "",
        setor: item.departamento ?? "",
        cargo: item.cargo_visivel || item.cargo || "",
        motivo: item.desligamento.trim(),
      });
    }

    if (!data || data.length < TAMANHO_PAGINA) break;
  }

  return linhas;
}

export type TipoTurnover = { tipo: string; quantidade: number };

// O tipo é o primeiro trecho do campo "desligamento" (antes do " - "). Sem acento e sem caixa,
// "involuntário" é testado antes de "voluntário", porque contém essa palavra.
export function agruparPorTipo(motivos: MotivoTurnover[]): TipoTurnover[] {
  const contagem = new Map<string, number>();

  for (const { motivo, quantidade } of motivos) {
    const primeiroTrecho = (motivo.split(" - ")[0] ?? "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim()
      .toLowerCase();
    const tipo = primeiroTrecho.startsWith("involunt")
      ? "Involuntário"
      : primeiroTrecho.startsWith("volunt")
        ? "Voluntário"
        : "Não classificado";
    contagem.set(tipo, (contagem.get(tipo) ?? 0) + quantidade);
  }

  return [...contagem.entries()]
    .map(([tipo, quantidade]) => ({ tipo, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade);
}
