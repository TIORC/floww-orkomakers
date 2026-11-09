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

export const TIPOS_FERIADO = ["federal", "estadual", "municipal", "interno"] as const;
export type TipoFeriado = (typeof TIPOS_FERIADO)[number];

export const ROTULO_TIPO_FERIADO: Record<TipoFeriado, string> = {
  federal: "Federal",
  estadual: "Estadual",
  municipal: "Municipal",
  interno: "Interno",
};

// Feriado cadastrado pelo RH. Recorrente: vale todo ano no mesmo dia e mês (o ano de `data` é só referência).
export type FeriadoCadastrado = {
  id?: string;
  nome: string;
  data: string; // AAAA-MM-DD
  recorrente: boolean;
  tipo: TipoFeriado;
  abrangencia: string;
};

const cache = new Map<number, Map<string, string>>();

// Feriados calculados pelo código: nacionais (fixos e móveis), o 2 de Julho (Bahia) e os pontos facultativos
// de Carnaval e Corpus Christi. Os cadastrados pelo RH são somados a eles em `feriadosDoAno`.
function feriadosAutomaticosDoAno(ano: number): Map<string, string> {
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

function ehBissexto(ano: number): boolean {
  return (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
}

// Data ISO em que um feriado cadastrado cai no ano pedido, ou undefined se não cai nesse ano.
export function dataDoCadastroNoAno(feriado: FeriadoCadastrado, ano: number): string | undefined {
  if (!feriado.recorrente) return feriado.data.startsWith(`${ano}-`) ? feriado.data : undefined;
  const mesDia = feriado.data.slice(5);
  // 29/02 recorrente não existe em ano que não é bissexto.
  if (mesDia === "02-29" && !ehBissexto(ano)) return undefined;
  return `${ano}-${mesDia}`;
}

// Feriados do ano, por data ISO: os calculados pelo código somados aos cadastrados pelo RH.
// Um cadastrado com a mesma data de um calculado passa a valer com o nome cadastrado.
export function feriadosDoAno(ano: number, cadastrados: FeriadoCadastrado[] = []): Map<string, string> {
  const automaticos = feriadosAutomaticosDoAno(ano);
  if (cadastrados.length === 0) return automaticos;

  const mapa = new Map(automaticos);
  for (const feriado of cadastrados) {
    const iso = dataDoCadastroNoAno(feriado, ano);
    if (iso) mapa.set(iso, feriado.nome);
  }
  return mapa;
}

// Nome do feriado numa data ISO, ou undefined se não for feriado.
export function nomeDoFeriado(iso: string, cadastrados: FeriadoCadastrado[] = []): string | undefined {
  return feriadosDoAno(Number(iso.slice(0, 4)), cadastrados).get(iso);
}

export type FeriadoDoAno = { iso: string; nome: string; tipo: TipoFeriado; cadastrado: boolean };

// Tipo dos feriados calculados pelo código: o 2 de Julho é estadual (Bahia); os demais, federais.
function tipoAutomatico(nome: string): TipoFeriado {
  return /bahia/i.test(nome) ? "estadual" : "federal";
}

// Feriados do ano com tipo e origem, na ordem da data.
export function feriadosDetalhados(ano: number, cadastrados: FeriadoCadastrado[] = []): FeriadoDoAno[] {
  const mapa = feriadosDoAno(ano, cadastrados);
  const tipoDoCadastro = new Map<string, TipoFeriado>();
  for (const feriado of cadastrados) {
    const iso = dataDoCadastroNoAno(feriado, ano);
    if (iso) tipoDoCadastro.set(iso, feriado.tipo);
  }
  return [...mapa.entries()]
    .map(([iso, nome]) => ({
      iso,
      nome,
      tipo: tipoDoCadastro.get(iso) ?? tipoAutomatico(nome),
      cadastrado: tipoDoCadastro.has(iso),
    }))
    .sort((a, b) => a.iso.localeCompare(b.iso));
}

// Os próximos feriados a partir de hoje (este ano e o seguinte), opcionalmente de um só tipo.
export function proximosFeriados(
  hoje: string,
  cadastrados: FeriadoCadastrado[],
  quantidade: number,
  tipo?: TipoFeriado,
): FeriadoDoAno[] {
  const ano = Number(hoje.slice(0, 4));
  return [...feriadosDetalhados(ano, cadastrados), ...feriadosDetalhados(ano + 1, cadastrados)]
    .filter((feriado) => feriado.iso >= hoje && (!tipo || feriado.tipo === tipo))
    .sort((a, b) => a.iso.localeCompare(b.iso))
    .slice(0, quantidade);
}

// Quantos dias faltam de `hoje` até `iso` (AAAA-MM-DD).
export function diasAte(hoje: string, iso: string): number {
  const emDias = (texto: string) => {
    const [ano = 0, mes = 1, dia = 1] = texto.split("-").map(Number);
    return Date.UTC(ano, mes - 1, dia) / 86_400_000;
  };
  return Math.round(emDias(iso) - emDias(hoje));
}

// Próxima data em que o feriado cai, a partir de `hoje` (AAAA-MM-DD). Undefined se não cai mais.
export function proximaOcorrencia(feriado: FeriadoCadastrado, hoje: string): string | undefined {
  const anoHoje = Number(hoje.slice(0, 4));
  for (let ano = anoHoje; ano <= anoHoje + 8; ano++) {
    const iso = dataDoCadastroNoAno(feriado, ano);
    if (iso && iso >= hoje) return iso;
  }
  return undefined;
}
