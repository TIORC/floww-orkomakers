export const PERFIS_DISC = [
  { valor: "Comunicador", atalho: "C" },
  { valor: "Executor", atalho: "E" },
  { valor: "Analista", atalho: "A" },
  { valor: "Planejador", atalho: "P" },
] as const;

export type PerfilDisc = (typeof PERFIS_DISC)[number]["valor"];
export type PercentuaisDisc = Record<PerfilDisc, number>;

/**
 * Cores de cada perfil DISC.
 * Comunicador amarelo, Executor vermelho, Analista azul e Planejador verde.
 */
export const TONS_DISC: Record<
  PerfilDisc,
  {
    chip: string;
    bloco: string;
    barra: string;
    thumb: string;
    texto: string;
    ponto: string;
  }
> = {
  Comunicador: {
    chip: "bg-amber-400 text-slate-900",
    bloco: "border-amber-400 bg-amber-400/10",
    barra: "bg-amber-400",
    thumb: "border-amber-400 bg-amber-400 focus-visible:ring-amber-400/40",
    texto: "text-amber-500",
    ponto: "bg-amber-400",
  },
  Executor: {
    chip: "bg-red-500 text-white",
    bloco: "border-red-500/40 bg-red-500/5",
    barra: "bg-red-500",
    thumb: "border-red-500 bg-red-500 focus-visible:ring-red-500/40",
    texto: "text-red-500",
    ponto: "bg-red-500",
  },
  Analista: {
    chip: "bg-blue-600 text-white",
    bloco: "border-blue-600/40 bg-blue-600/5",
    barra: "bg-blue-600",
    thumb: "border-blue-600 bg-blue-600 focus-visible:ring-blue-600/40",
    texto: "text-blue-600",
    ponto: "bg-blue-600",
  },
  Planejador: {
    chip: "bg-emerald-500 text-white",
    bloco: "border-emerald-500/40 bg-emerald-500/5",
    barra: "bg-emerald-500",
    thumb: "border-emerald-500 bg-emerald-500 focus-visible:ring-emerald-500/40",
    texto: "text-emerald-500",
    ponto: "bg-emerald-500",
  },
};

/** Acima deste percentual o perfil é predominante; o restante é secundário. */
export const LIMITE_PREDOMINANTE = 30;

/**
 * Perfis do maior para o menor percentual (empates seguem a ordem de PERFIS_DISC).
 * Quem passa de LIMITE_PREDOMINANTE é predominante; os demais são secundários.
 */
export function ordenarPerfisDisc(valores: Partial<Record<PerfilDisc, number>>) {
  return PERFIS_DISC.map((perfil) => ({
    perfil: perfil.valor,
    valor: valores[perfil.valor] ?? 0,
  }))
    .sort((a, b) => b.valor - a.valor)
    .map((item) => ({ ...item, predominante: item.valor > LIMITE_PREDOMINANTE }));
}
