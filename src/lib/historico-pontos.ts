import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { normalizarNome } from "@/lib/banco-horas";
import { feriadosDoAno } from "@/lib/feriados";
import {
  agruparBatidasPorDia,
  dataLocalDeIso,
  marcacoesDoDia,
  minutosTrabalhadosDoDia,
  type Batida,
  type Marcacao,
} from "@/lib/ponto-batidas";

// A tipagem gerada do banco ainda não inclui as tabelas do banco de horas nem as solicitações de ponto.
const db = supabase as unknown as SupabaseClient<any>;

export type TipoSolicitacaoPonto = "ponto" | "falta_justificada";

export type SolicitacaoPonto = {
  id: string;
  tipo: TipoSolicitacaoPonto;
  // "2026-11-13"
  data: string;
  // "13:05" (vazios quando a solicitação é falta justificada)
  entrada: string | null;
  saida: string | null;
  motivo: string;
  status: "pendente" | "aprovado" | "recusado";
};

// Um dia do espelho de ponto, como está no banco. Minutos para os totais.
export type DiaRegistrado = {
  // "2026-11-13"
  data: string;
  diaSemana: string;
  trabalhado: number;
  horasExtras: number;
  horasFaltas: number;
  observacao: string;
};

// Uma linha da tela "Pontos registrados": um dia do mês, já com feriado, folga e as solicitações do dia.
export type LinhaDoMes = DiaRegistrado & {
  feriado: string | null;
  folga: boolean;
  solicitacoes: SolicitacaoPonto[];
  // Entradas e saídas batidas no modal, na ordem em que aconteceram.
  marcacoes: Marcacao[];
};

// "2026-11-13" para "13/11/2026".
export function dataBrDeIso(iso: string): string {
  const [ano = "", mes = "", dia = ""] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

// "2026-11-13" para "Sexta-feira".
export function diaDaSemanaDeIso(iso: string): string {
  const texto = new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
  });
  return `${texto.charAt(0).toUpperCase()}${texto.slice(1)}`;
}

// "2026-11-13" para "2026-11".
export function mesDeIso(iso: string): string {
  return iso.slice(0, 7);
}

// "2026-11" para "Novembro/2026", como no seletor de mês da tela.
export function rotuloMesCurto(mes: string): string {
  const [ano = 0, numero = 1] = mes.split("-").map(Number);
  const nome = new Date(ano, numero - 1, 1).toLocaleDateString("pt-BR", { month: "long" });
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)}/${ano}`;
}

// Meses em que há algo para mostrar, do mais recente para o mais antigo. O mês de hoje entra sempre.
export function mesesDoHistorico(
  dias: DiaRegistrado[],
  solicitacoes: SolicitacaoPonto[],
  hoje: string,
  batidas: Batida[] = [],
): string[] {
  const meses = new Set<string>([
    mesDeIso(hoje),
    ...dias.map((d) => mesDeIso(d.data)),
    ...solicitacoes.map((s) => mesDeIso(s.data)),
    ...batidas.map((b) => mesDeIso(dataLocalDeIso(b.registradoEm))),
  ]);
  return [...meses].sort((a, b) => b.localeCompare(a));
}

// Os dias do mês até hoje (o mês inteiro, se ele já passou), em AAAA-MM-DD. Mês futuro não tem dia nenhum.
export function diasAteOFim(mes: string, hoje: string): string[] {
  const mesHoje = mesDeIso(hoje);
  if (mes > mesHoje) return [];
  const [ano = 0, numero = 1] = mes.split("-").map(Number);
  // Dia zero do mês seguinte é o último dia deste mês.
  const totalDias = new Date(ano, numero, 0).getDate();
  const limite = mes === mesHoje ? Number(hoje.slice(8, 10)) : totalDias;
  return Array.from({ length: limite }, (_, i) => `${mes}-${String(i + 1).padStart(2, "0")}`);
}

// Os dias do mês, em ordem de data. Com `hoje`, entram todos os dias do mês até hoje, mesmo os zerados.
// Entram também os dias com registro e os dias com solicitação, mesmo sem espelho ainda.
export function linhasDoMes(
  dias: DiaRegistrado[],
  solicitacoes: SolicitacaoPonto[],
  mes: string,
  batidas: Batida[] = [],
  hoje?: string,
): LinhaDoMes[] {
  const porData = new Map<string, LinhaDoMes>();
  const linhaDe = (data: string): LinhaDoMes => {
    let linha = porData.get(data);
    if (!linha) {
      const ano = Number(data.slice(0, 4));
      linha = {
        data,
        diaSemana: diaDaSemanaDeIso(data),
        trabalhado: 0,
        horasExtras: 0,
        horasFaltas: 0,
        observacao: "",
        feriado: feriadosDoAno(ano).get(data) ?? null,
        folga: false,
        solicitacoes: [],
        marcacoes: [],
      };
      porData.set(data, linha);
    }
    return linha;
  };

  const diasComEspelho = new Set<string>();
  for (const dia of dias) {
    if (mesDeIso(dia.data) !== mes) continue;
    diasComEspelho.add(dia.data);
    const linha = linhaDe(dia.data);
    linha.trabalhado += dia.trabalhado;
    linha.horasExtras += dia.horasExtras;
    linha.horasFaltas += dia.horasFaltas;
    linha.observacao = [linha.observacao, dia.observacao].filter(Boolean).join(" · ");
    linha.folga = linha.folga || /folga/i.test(dia.observacao);
  }
  // Dia sem espelho ainda (ex.: hoje) mostra o trabalhado calculado pelas batidas; dia com espelho mantém o do PDF.
  for (const [dia, batidasDoDia] of agruparBatidasPorDia(batidas)) {
    if (mesDeIso(dia) !== mes) continue;
    const linha = linhaDe(dia);
    linha.marcacoes = marcacoesDoDia(batidasDoDia);
    if (!diasComEspelho.has(dia)) linha.trabalhado = minutosTrabalhadosDoDia(batidasDoDia);
  }
  if (hoje) for (const data of diasAteOFim(mes, hoje)) linhaDe(data);
  for (const solicitacao of solicitacoes) {
    if (mesDeIso(solicitacao.data) !== mes) continue;
    linhaDe(solicitacao.data).solicitacoes.push(solicitacao);
  }

  return [...porData.values()].sort((a, b) => a.data.localeCompare(b.data));
}

// Confere o formulário de "Adicionar ponto" ou "Falta justificada". Devolve a primeira mensagem de erro, ou null.
export function validarSolicitacao(
  dados: {
    tipo: TipoSolicitacaoPonto;
    data: string;
    entrada: string;
    saida: string;
    motivo: string;
  },
  hoje: string,
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dados.data)) return "Escolha a data.";
  if (dados.data > hoje) return "Não dá para solicitar um registro de um dia que ainda não chegou.";

  if (dados.tipo === "falta_justificada") {
    return dados.motivo.trim() ? null : "Explique o motivo da falta.";
  }

  if (!/^\d{2}:\d{2}$/.test(dados.entrada) || !/^\d{2}:\d{2}$/.test(dados.saida)) {
    return "Informe a entrada e a saída.";
  }
  if (dados.entrada === dados.saida) return "A entrada e a saída não podem ser iguais.";
  return null;
}

type LinhaDia = {
  data: string;
  dia_semana: string;
  trabalhado_min: number;
  horas_extras_min: number;
  horas_faltas_min: number;
  observacao: string;
};

// Converte a linha do banco (horas em minutos) para o formato da tela.
function linhaParaDia(linha: LinhaDia): DiaRegistrado {
  return {
    data: String(linha.data).slice(0, 10),
    diaSemana: linha.dia_semana,
    trabalhado: linha.trabalhado_min,
    horasExtras: linha.horas_extras_min,
    horasFaltas: linha.horas_faltas_min,
    observacao: linha.observacao ?? "",
  };
}

// Os dias do banco de horas de quem tem um destes nomes (nome ou nome completo do cadastro).
// O RLS já limita quem é colaborador às próprias linhas; para a gestão, a comparação pelo nome separa a pessoa.
export async function carregarDiasDoColaborador(nomes: string[]): Promise<DiaRegistrado[]> {
  const alvo = new Set(nomes.map(normalizarNome).filter(Boolean));
  if (alvo.size === 0) return [];

  const { data: espelhos, error } = await db
    .from("banco_horas_espelhos")
    .select("id, colaborador_nome");
  if (error) throw error;
  const ids = ((espelhos ?? []) as { id: string; colaborador_nome: string }[])
    .filter((e) => alvo.has(normalizarNome(e.colaborador_nome)))
    .map((e) => e.id);
  if (ids.length === 0) return [];

  const { data, error: erroDias } = await db
    .from("banco_horas_dias")
    .select("data, dia_semana, trabalhado_min, horas_extras_min, horas_faltas_min, observacao")
    .in("espelho_id", ids)
    .order("data", { ascending: true });
  if (erroDias) throw erroDias;
  return ((data ?? []) as LinhaDia[]).map(linhaParaDia);
}

type LinhaSolicitacao = {
  id: string;
  tipo: TipoSolicitacaoPonto;
  data: string;
  entrada: string | null;
  saida: string | null;
  motivo: string;
  status: SolicitacaoPonto["status"];
};

// Horário do banco vem como "13:05:00"; a tela mostra "13:05".
const hora = (valor: string | null) => (valor ? valor.slice(0, 5) : null);

export async function carregarMinhasSolicitacoes(email: string): Promise<SolicitacaoPonto[]> {
  const { data, error } = await db
    .from("ponto_solicitacoes")
    .select("id, tipo, data, entrada, saida, motivo, status")
    .eq("solicitante_email", email)
    .order("data", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as LinhaSolicitacao[]).map((s) => ({
    id: s.id,
    tipo: s.tipo,
    data: String(s.data).slice(0, 10),
    entrada: hora(s.entrada),
    saida: hora(s.saida),
    motivo: s.motivo,
    status: s.status,
  }));
}

export type NovaSolicitacao = {
  tipo: TipoSolicitacaoPonto;
  data: string;
  entrada: string;
  saida: string;
  motivo: string;
};

// Envia a solicitação como pendente. O RLS garante que o solicitante é a própria pessoa logada.
export async function enviarSolicitacaoDePonto(
  email: string,
  nome: string,
  dados: NovaSolicitacao,
): Promise<void> {
  const ehPonto = dados.tipo === "ponto";
  const { error } = await db.from("ponto_solicitacoes").insert({
    tipo: dados.tipo,
    solicitante_email: email,
    solicitante_nome: nome,
    data: dados.data,
    entrada: ehPonto ? dados.entrada : null,
    saida: ehPonto ? dados.saida : null,
    motivo: dados.motivo.trim(),
    status: "pendente",
  });
  if (error) throw error;
}
