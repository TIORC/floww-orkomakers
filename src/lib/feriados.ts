// Data ISO ("2026-04-03") a partir de ano, mês (0 a 11) e dia. Fica aqui para este arquivo não depender do calendário.
function paraIso(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

// Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher), de onde saem Carnaval, Sexta-feira Santa e Corpus Christi.
function pascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function aposPascoa(ano: number, dias: number): string {
  const data = pascoa(ano);
  data.setDate(data.getDate() + dias);
  return paraIso(data.getFullYear(), data.getMonth(), data.getDate());
}

const cache = new Map<number, Map<string, string>>();

// Feriados do ano, por data ISO: nacionais, o 2 de Julho (Bahia) e os pontos facultativos de Carnaval e Corpus Christi.
// Feriados municipais não entram, porque variam de cidade para cidade.
export function feriadosDoAno(ano: number): Map<string, string> {
  const emCache = cache.get(ano);
  if (emCache) return emCache;

  const fixo = (mes: number, dia: number) => paraIso(ano, mes - 1, dia);
  const lista: [string, string][] = [
    [fixo(1, 1), "Confraternização Universal"],
    [aposPascoa(ano, -48), "Carnaval (ponto facultativo)"],
    [aposPascoa(ano, -47), "Carnaval (ponto facultativo)"],
    [aposPascoa(ano, -2), "Sexta-feira Santa"],
    [fixo(4, 21), "Tiradentes"],
    [fixo(5, 1), "Dia do Trabalho"],
    [fixo(7, 2), "Independência da Bahia"],
    [aposPascoa(ano, 60), "Corpus Christi (ponto facultativo)"],
    [fixo(9, 7), "Independência do Brasil"],
    [fixo(10, 12), "Nossa Senhora Aparecida"],
    [fixo(11, 2), "Finados"],
    [fixo(11, 15), "Proclamação da República"],
    // Dia da Consciência Negra é feriado nacional desde 2024.
    ...(ano >= 2024 ? ([[fixo(11, 20), "Dia da Consciência Negra"]] as [string, string][]) : []),
    [fixo(12, 25), "Natal"],
  ];

  const mapa = new Map(lista);
  cache.set(ano, mapa);
  return mapa;
}

// Nome do feriado numa data ISO, ou undefined se não for feriado.
export function nomeDoFeriado(iso: string): string | undefined {
  return feriadosDoAno(Number(iso.slice(0, 4))).get(iso);
}
