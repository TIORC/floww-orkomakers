export const NOMES_MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export const DIAS_DA_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"] as const;

// As semanas de um mês (mes de 0 a 11), começando no domingo. Dias fora do mês vêm como null.
export function semanasDoMes(ano: number, mes: number): (number | null)[][] {
  const vazios = new Date(ano, mes, 1).getDay();
  const total = new Date(ano, mes + 1, 0).getDate();
  const celulas: (number | null)[] = [
    ...Array.from({ length: vazios }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
  while (celulas.length % 7 !== 0) celulas.push(null);
  const semanas: (number | null)[][] = [];
  for (let i = 0; i < celulas.length; i += 7) semanas.push(celulas.slice(i, i + 7));
  return semanas;
}

// Datas como texto ISO ("2026-11-10"): comparam bem como texto e não sofrem com fuso horário.
export function paraIso(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function hojeIso(): string {
  const agora = new Date();
  return paraIso(agora.getFullYear(), agora.getMonth(), agora.getDate());
}

function emUtc(iso: string): number {
  const [ano = 0, mes = 1, dia = 1] = iso.split("-").map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

// "2026-11-10" para "10/11/2026".
export function dataBr(iso: string): string {
  return iso.split("-").reverse().join("/");
}

// Dias corridos do período, contando o primeiro e o último (10/11 a 14/11 são 5 dias).
export function diasDoPeriodo(inicio: string, fim: string): number {
  return Math.round((emUtc(fim) - emUtc(inicio)) / 86_400_000) + 1;
}

// Dia de voltar ao trabalho: o dia seguinte ao fim das férias, pulando sábado e domingo. Feriados não são pulados:
// os que caem dentro das férias contam como dia de férias, sem estender o período (CLT).
export function diaDeRetorno(fim: string): string {
  const data = new Date(emUtc(fim));
  do {
    data.setUTCDate(data.getUTCDate() + 1);
  } while (data.getUTCDay() === 0 || data.getUTCDay() === 6);
  return paraIso(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate());
}

// Os dois cliques do período, em qualquer ordem, viram início e fim.
export function ordenarPeriodo(a: string, b: string): { inicio: string; fim: string } {
  return a <= b ? { inicio: a, fim: b } : { inicio: b, fim: a };
}
