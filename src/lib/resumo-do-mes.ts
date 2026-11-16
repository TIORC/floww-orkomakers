import {
  bancoDeHoras,
  carregarEspelhos,
  encadearSaldos,
  normalizarNome,
  type EspelhoSalvo,
} from "@/lib/banco-horas";
import type { LinhaDoMes } from "@/lib/historico-pontos";

export type ResumoDoMes = {
  // Dias do mês com algum trabalho (do espelho ou das batidas).
  diasTrabalhados: number;
  // Soma do trabalhado dos dias do mês, em minutos.
  horasNoMes: number;
  // Saldo do banco de horas do espelho do mês, em minutos. Null quando ainda não há espelho do mês.
  bancoDeHoras: number | null;
};

// "9h", "8h48min" e "0h", como no restante da tela de ponto.
export function formatarDuracao(minutos: number): string {
  const sinal = minutos < 0 ? "-" : "";
  const absoluto = Math.abs(minutos);
  const horas = Math.floor(absoluto / 60);
  const resto = absoluto % 60;
  const texto = resto === 0 ? `${horas}h` : `${horas}h${String(resto).padStart(2, "0")}min`;
  return `${sinal}${texto}`;
}

// Os números do cartão de resumo do modal de bater ponto. As linhas já vêm com o trabalhado do espelho
// ou o calculado pelas batidas, e o banco de horas é o do espelho cujo mês de referência é o mês pedido.
export function resumoDoMes(
  linhas: LinhaDoMes[],
  espelhos: EspelhoSalvo[],
  mes: string,
): ResumoDoMes {
  const doMes = linhas.filter((linha) => linha.data.startsWith(mes));
  const espelho = espelhos.find((e) => e.mes === mes);
  return {
    diasTrabalhados: doMes.filter((linha) => linha.trabalhado > 0).length,
    horasNoMes: doMes.reduce((soma, linha) => soma + linha.trabalhado, 0),
    bancoDeHoras: espelho ? bancoDeHoras(espelho) : null,
  };
}

// Os espelhos de quem tem um destes nomes, com o saldo anterior já encadeado como na tela do banco de horas.
export async function carregarEspelhosDoColaborador(nomes: string[]): Promise<EspelhoSalvo[]> {
  const alvo = new Set(nomes.map(normalizarNome).filter(Boolean));
  if (alvo.size === 0) return [];
  const todos = await carregarEspelhos();
  return encadearSaldos(todos).filter((e) => alvo.has(normalizarNome(e.funcionario)));
}
