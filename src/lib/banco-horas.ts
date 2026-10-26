import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { limparDepartamento, type EspelhoPonto } from "@/lib/espelho-ponto";

// A tipagem gerada do banco ainda não inclui as tabelas do banco de horas.
const db = supabase as unknown as SupabaseClient<any>;

// Uma linha da planilha: um colaborador em um período. Todos os horários são minutos.
export type EspelhoSalvo = {
  id: string;
  funcionario: string;
  cargo: string;
  departamento: string;
  periodoInicio: string;
  periodoFim: string;
  // "2026-10": o mês em que o período termina.
  mes: string;
  // Calculados a partir do PDF do espelho.
  horasExtras: number;
  horasFaltas: number;
  trabalhado: number;
  // Saldo anterior em uso: o digitado pelo RH ou, se não houver, o banco de horas do período anterior.
  saldoAnterior: number;
  // O que o RH digitou. Null quer dizer "automático".
  saldoManual: number | null;
  // Digitados pelo RH. Horas para compensar têm sinal; horas a pagar/descontar é sempre negativo.
  pagarDescontar: number;
  compensar: number;
  observacao: string;
};

// Campos que o RH edita na tela, com o nome da coluna no banco.
const COLUNA_DO_CAMPO = {
  saldoAnterior: "saldo_anterior_min",
  pagarDescontar: "horas_pagar_desc_min",
  compensar: "horas_compensar_min",
  observacao: "observacao",
} as const;

export type CampoEditavel = keyof typeof COLUNA_DO_CAMPO;

type LinhaEspelho = {
  id: string;
  colaborador_nome: string;
  colaborador_cargo: string;
  colaborador_departamento: string;
  periodo_inicio: string;
  periodo_fim: string;
  mes_referencia: string;
  horas_extras_min: number;
  horas_faltas_min: number;
  horas_trabalhadas_min: number;
  saldo_anterior_min: number | null;
  horas_pagar_desc_min: number;
  horas_compensar_min: number;
  observacao: string;
};

// O banco de horas do mês, como na planilha: saldo anterior + horas extras - horas faltas.
export function bancoDeHoras(
  espelho: Pick<EspelhoSalvo, "saldoAnterior" | "horasExtras" | "horasFaltas">,
) {
  return espelho.saldoAnterior + espelho.horasExtras - espelho.horasFaltas;
}

// Nome sem acento, em maiúsculas e com espaços simples, para comparar "Vitória" com "VITORIA".
export function normalizarNome(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

// Completa o departamento dos espelhos que vieram sem ele, usando o do cadastro de colaboradores (casando pelo nome).
export function completarDepartamentos(
  espelhos: EspelhoSalvo[],
  cadastro: Map<string, string>,
): EspelhoSalvo[] {
  return espelhos.map((e) =>
    e.departamento ? e : { ...e, departamento: cadastro.get(normalizarNome(e.funcionario)) ?? "" },
  );
}

// Encadeia os saldos: o saldo anterior de um período é o banco de horas do período anterior do mesmo colaborador,
// a menos que o RH tenha digitado outro valor. Corrigir um mês corrige os seguintes, porque tudo é recalculado.
export function encadearSaldos(espelhos: EspelhoSalvo[]): EspelhoSalvo[] {
  const efetivos = new Map<string, EspelhoSalvo>();
  const porColaborador = new Map<string, EspelhoSalvo[]>();
  for (const e of espelhos) {
    const chave = normalizarNome(e.funcionario);
    porColaborador.set(chave, [...(porColaborador.get(chave) ?? []), e]);
  }
  for (const periodos of porColaborador.values()) {
    periodos.sort((a, b) => a.periodoInicio.localeCompare(b.periodoInicio));
    let anterior: EspelhoSalvo | undefined;
    for (const e of periodos) {
      const automatico = anterior ? bancoDeHoras(anterior) : 0;
      const atual = { ...e, saldoAnterior: e.saldoManual ?? automatico };
      efetivos.set(e.id, atual);
      anterior = atual;
    }
  }
  return espelhos.map((e) => efetivos.get(e.id) ?? e);
}

const MS_DIA = 24 * 60 * 60 * 1000;

function paraIso(data: Date) {
  return data.toISOString().slice(0, 10);
}

// Um mês depois, no mesmo dia (ou no último dia do mês, se ele não existir): 2026-10-20 vira 2026-11-20.
function maisUmMes(iso: string) {
  const [ano = 0, mes = 1, dia = 1] = iso.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  return paraIso(new Date(Date.UTC(ano, mes, Math.min(dia, ultimoDia))));
}

function diaSeguinte(iso: string) {
  return paraIso(new Date(Date.parse(iso) + MS_DIA));
}

export type NovoPeriodo = Pick<
  EspelhoSalvo,
  "funcionario" | "cargo" | "departamento" | "periodoInicio" | "periodoFim"
>;

const chaveDoPeriodo = (e: NovoPeriodo) =>
  `${normalizarNome(e.funcionario)}|${e.periodoInicio}|${e.periodoFim}`;

// Períodos que já deveriam existir e ainda não existem. Quando o último período termina, o seguinte começa no dia
// seguinte e dura um mês (21/09 a 20/10 é seguido de 21/10 a 20/11). Cada colaborador do último período ganha
// uma linha zerada, e o saldo anterior dela vem do cálculo automático. "hoje" é uma data ISO (2026-10-26).
export function novosPeriodos(espelhos: EspelhoSalvo[], hoje: string): NovoPeriodo[] {
  if (espelhos.length === 0) return [];
  const existentes = new Set(espelhos.map(chaveDoPeriodo));

  // Seguem quem tem espelho no último período ou no anterior (quem saiu antes disso não ganha linha nova).
  const fins = [...new Set(espelhos.map((e) => e.periodoFim))].sort().reverse();
  const corte = fins[1] ?? fins[0] ?? "";
  const maisRecente = new Map<string, EspelhoSalvo>();
  for (const e of espelhos) {
    const chave = normalizarNome(e.funcionario);
    const atual = maisRecente.get(chave);
    if (!atual || e.periodoFim > atual.periodoFim) maisRecente.set(chave, e);
  }
  const colaboradores = [...maisRecente.values()].filter((e) => e.periodoFim >= corte);

  const criados: NovoPeriodo[] = [];
  // Parte do período anterior ao último, para completar quem ficou de fora do último; os que já existem são pulados.
  let fimAtual = corte;
  // O limite evita laço infinito se a data de hoje vier errada.
  for (let rodada = 0; rodada < 24; rodada++) {
    const inicio = diaSeguinte(fimAtual);
    if (inicio > hoje) break;
    fimAtual = maisUmMes(fimAtual);
    for (const e of colaboradores) {
      const novo: NovoPeriodo = {
        funcionario: e.funcionario,
        cargo: e.cargo,
        departamento: e.departamento,
        periodoInicio: inicio,
        periodoFim: fimAtual,
      };
      if (!existentes.has(chaveDoPeriodo(novo))) criados.push(novo);
    }
  }
  return criados;
}

// Abre no banco os períodos que faltam, zerados. Se outra pessoa abrir ao mesmo tempo, as linhas repetidas são ignoradas.
export async function abrirNovosPeriodos(espelhos: EspelhoSalvo[], hoje: string): Promise<number> {
  const novos = novosPeriodos(espelhos, hoje);
  for (let inicio = 0; inicio < novos.length; inicio += TAMANHO_LOTE) {
    const { error } = await db.from("banco_horas_espelhos").upsert(
      novos.slice(inicio, inicio + TAMANHO_LOTE).map((e) => ({
        colaborador_nome: e.funcionario,
        colaborador_cargo: e.cargo,
        colaborador_departamento: e.departamento,
        periodo_inicio: e.periodoInicio,
        periodo_fim: e.periodoFim,
        importado_por: "automático",
      })),
      { onConflict: "colaborador_nome,periodo_inicio,periodo_fim", ignoreDuplicates: true },
    );
    if (error) throw error;
  }
  return novos.length;
}

const TAMANHO_PAGINA_CADASTRO = 1000;

// Departamento de cada colaborador do cadastro, pelo nome completo e pelo nome. Se falhar, a tela segue sem o complemento.
async function departamentosDoCadastro(): Promise<Map<string, string>> {
  const porNome = new Map<string, string>();
  for (let inicio = 0; ; inicio += TAMANHO_PAGINA_CADASTRO) {
    const { data, error } = await db
      .from("colaboradores_importados")
      .select("nome, nome_completo, departamento")
      .order("id", { ascending: true })
      .range(inicio, inicio + TAMANHO_PAGINA_CADASTRO - 1);
    if (error) throw error;
    const lote = (data ?? []) as {
      nome: string | null;
      nome_completo: string | null;
      departamento: string | null;
    }[];
    for (const c of lote) {
      const departamento = limparDepartamento(c.departamento ?? "");
      if (!departamento) continue;
      for (const nome of [c.nome_completo, c.nome])
        if (nome) porNome.set(normalizarNome(nome), departamento);
    }
    if (lote.length < TAMANHO_PAGINA_CADASTRO) return porNome;
  }
}

export async function carregarEspelhos(): Promise<EspelhoSalvo[]> {
  const { data, error } = await db
    .from("banco_horas_espelhos")
    .select("*")
    .order("mes_referencia", { ascending: false })
    .order("colaborador_nome", { ascending: true });
  if (error) throw error;

  const espelhos = ((data ?? []) as LinhaEspelho[]).map((e) => ({
    id: e.id,
    funcionario: e.colaborador_nome,
    cargo: e.colaborador_cargo,
    departamento: limparDepartamento(e.colaborador_departamento),
    periodoInicio: e.periodo_inicio,
    periodoFim: e.periodo_fim,
    mes: e.mes_referencia.slice(0, 7),
    horasExtras: e.horas_extras_min,
    horasFaltas: e.horas_faltas_min,
    trabalhado: e.horas_trabalhadas_min,
    saldoAnterior: e.saldo_anterior_min ?? 0,
    saldoManual: e.saldo_anterior_min,
    pagarDescontar: e.horas_pagar_desc_min,
    compensar: e.horas_compensar_min,
    observacao: e.observacao,
  }));

  if (espelhos.every((e) => e.departamento)) return espelhos;
  try {
    return completarDepartamentos(espelhos, await departamentosDoCadastro());
  } catch {
    return espelhos;
  }
}

const TAMANHO_LOTE = 100;
const TAMANHO_LOTE_DIAS = 500;

// Grava os totais lidos dos PDFs, em lotes (um pedido ao banco por lote, não um por arquivo). Se o colaborador já
// tem esse período, os totais são atualizados, mas o que o RH digitou (saldo anterior, a pagar/descontar,
// a compensar e observações) é mantido: essas colunas não entram no upsert.
export async function salvarEspelhos(espelhos: EspelhoPonto[]) {
  const { data: auth } = await supabase.auth.getUser();
  const importadoPor = auth.user?.email ?? "";

  // Dois PDFs do mesmo colaborador e período no mesmo lote travariam o upsert; vale o último.
  const unicos = new Map<string, EspelhoPonto>();
  for (const e of espelhos) unicos.set(`${e.funcionario}|${e.periodoInicio}|${e.periodoFim}`, e);

  const linhas = [...unicos.values()].map((espelho) => ({
    colaborador_nome: espelho.funcionario,
    colaborador_cargo: espelho.cargo,
    colaborador_departamento: espelho.departamento,
    periodo_inicio: espelho.periodoInicio,
    periodo_fim: espelho.periodoFim,
    horas_extras_min: espelho.totais.horasExtras,
    horas_faltas_min: espelho.totais.horasFaltas,
    horas_trabalhadas_min: espelho.totais.trabalhado,
    importado_por: importadoPor,
  }));

  const ids = new Map<string, string>();
  for (let inicio = 0; inicio < linhas.length; inicio += TAMANHO_LOTE) {
    const { data, error } = await db
      .from("banco_horas_espelhos")
      .upsert(linhas.slice(inicio, inicio + TAMANHO_LOTE), {
        onConflict: "colaborador_nome,periodo_inicio,periodo_fim",
      })
      .select("id, colaborador_nome, periodo_inicio, periodo_fim");
    if (error) throw error;
    for (const e of (data ?? []) as {
      id: string;
      colaborador_nome: string;
      periodo_inicio: string;
      periodo_fim: string;
    }[]) {
      ids.set(`${e.colaborador_nome}|${e.periodo_inicio}|${e.periodo_fim}`, e.id);
    }
  }

  // Os dias de cada espelho, para a tela de detalhe. O tratamento da falta não entra no upsert, então se mantém.
  const dias = [...unicos.entries()].flatMap(([chave, espelho]) => {
    const espelhoId = ids.get(chave);
    if (!espelhoId) return [];
    return espelho.dias.map((dia) => ({
      espelho_id: espelhoId,
      data: dia.dataIso,
      dia_semana: dia.diaSemana,
      trabalhado_min: dia.trabalhado,
      horas_extras_min: dia.horasExtras,
      horas_faltas_min: dia.horasFaltas,
      observacao: dia.observacao,
    }));
  });
  for (let inicio = 0; inicio < dias.length; inicio += TAMANHO_LOTE_DIAS) {
    const { error } = await db
      .from("banco_horas_dias")
      .upsert(dias.slice(inicio, inicio + TAMANHO_LOTE_DIAS), { onConflict: "espelho_id,data" });
    if (error) throw error;
  }
}

// Um dia do espelho de ponto, como no PDF. Horários em minutos.
export type DiaSalvo = {
  id: string;
  // "21/09"
  data: string;
  diaSemana: string;
  trabalhado: number;
  horasExtras: number;
  horasFaltas: number;
  // Digitado pelo RH.
  tratamento: string;
  // Vem do PDF.
  observacao: string;
};

type LinhaDia = {
  id: string;
  data: string;
  dia_semana: string;
  trabalhado_min: number;
  horas_extras_min: number;
  horas_faltas_min: number;
  tratamento: string;
  observacao: string;
};

// Os dias de um espelho, em ordem de data. Vazio quando o PDF foi importado antes de o detalhe ser guardado.
export async function carregarDias(espelhoId: string): Promise<DiaSalvo[]> {
  const { data, error } = await db
    .from("banco_horas_dias")
    .select("*")
    .eq("espelho_id", espelhoId)
    .order("data", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as LinhaDia[]).map((d) => ({
    id: d.id,
    data: `${d.data.slice(8, 10)}/${d.data.slice(5, 7)}`,
    diaSemana: d.dia_semana,
    trabalhado: d.trabalhado_min,
    horasExtras: d.horas_extras_min,
    horasFaltas: d.horas_faltas_min,
    tratamento: d.tratamento,
    observacao: d.observacao,
  }));
}

export async function atualizarTratamentoDoDia(id: string, tratamento: string) {
  const { error } = await db.from("banco_horas_dias").update({ tratamento }).eq("id", id);
  if (error) throw error;
}

export async function atualizarEspelho(
  id: string,
  campo: CampoEditavel,
  valor: number | string | null,
) {
  const { error } = await db
    .from("banco_horas_espelhos")
    .update({ [COLUNA_DO_CAMPO[campo]]: valor })
    .eq("id", id);
  if (error) throw error;
}

export async function excluirEspelho(id: string) {
  const { error } = await db.from("banco_horas_espelhos").delete().eq("id", id);
  if (error) throw error;
}

// "2026-10" para "outubro de 2026".
export function rotuloMes(mes: string): string {
  const [ano, numero] = mes.split("-").map(Number);
  return new Date(ano ?? 0, (numero ?? 1) - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}
