import { normalizarNome, type EspelhoSalvo } from "@/lib/banco-horas";
import { feriadosDoAno } from "@/lib/feriados";
import { diaDaSemanaDeIso, type DiaRegistrado } from "@/lib/historico-pontos";
import {
  agruparBatidasPorDia,
  diaCompleto,
  minutosTrabalhadosDoDia,
  type Batida,
} from "@/lib/ponto-batidas";

// Jornada de um dia útil, em minutos (9h). Sábado, domingo e feriado não têm jornada: tudo vira hora extra.
export const JORNADA_MIN = 540;

// Minutos previstos de trabalho em uma data ISO (AAAA-MM-DD).
export function jornadaPrevista(data: string): number {
  const diaDaSemana = new Date(`${data}T12:00:00`).getDay();
  const ano = Number(data.slice(0, 4));
  if (diaDaSemana === 0 || diaDaSemana === 6 || feriadosDoAno(ano).has(data)) return 0;
  return JORNADA_MIN;
}

// O que passou da jornada vira hora extra; o que faltou vira hora falta. O saldo do dia é extras − faltas.
export function saldoDoDia(data: string, trabalhado: number) {
  const diferenca = trabalhado - jornadaPrevista(data);
  return {
    horasExtras: Math.max(diferenca, 0),
    horasFaltas: Math.max(-diferenca, 0),
  };
}

// Um dia por data com as 4 batidas (entrada, saída para almoço, retorno e saída). Dia com menos batidas não entra
// no saldo: o dia ainda pode estar em andamento ou faltar batida.
export function diasDeBatidasCompletas(batidas: Batida[]): DiaRegistrado[] {
  const dias: DiaRegistrado[] = [];
  for (const [data, batidasDoDia] of agruparBatidasPorDia(batidas)) {
    if (!diaCompleto(batidasDoDia)) continue;
    const trabalhado = minutosTrabalhadosDoDia(batidasDoDia);
    const { horasExtras, horasFaltas } = saldoDoDia(data, trabalhado);
    dias.push({
      data,
      diaSemana: diaDaSemanaDeIso(data),
      trabalhado,
      horasExtras,
      horasFaltas,
      observacao: "Bater ponto",
    });
  }
  return dias;
}

// Soma os dias do bater ponto que o PDF não cobre aos totais dos espelhos do colaborador, nos períodos de cada espelho.
// Os espelhos que não são do colaborador ficam como estão.
export function aplicarBatidasNoBanco(
  espelhos: EspelhoSalvo[],
  nomes: string[],
  diasSemPdf: DiaRegistrado[],
): EspelhoSalvo[] {
  const alvo = new Set(nomes.map(normalizarNome).filter(Boolean));
  return espelhos.map((espelho) => {
    if (!alvo.has(normalizarNome(espelho.funcionario))) return espelho;
    const doPeriodo = diasSemPdf.filter(
      (dia) => dia.data >= espelho.periodoInicio && dia.data <= espelho.periodoFim,
    );
    if (doPeriodo.length === 0) return espelho;
    const soma = (campo: "trabalhado" | "horasExtras" | "horasFaltas") =>
      doPeriodo.reduce((total, dia) => total + dia[campo], 0);
    return {
      ...espelho,
      trabalhado: espelho.trabalhado + soma("trabalhado"),
      horasExtras: espelho.horasExtras + soma("horasExtras"),
      horasFaltas: espelho.horasFaltas + soma("horasFaltas"),
    };
  });
}
