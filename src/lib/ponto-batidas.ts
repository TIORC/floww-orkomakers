import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

// A tipagem gerada do banco ainda não inclui a tabela de batidas.
const db = supabase as unknown as SupabaseClient<any>;

// Uma batida confirmada no modal "Bater ponto". `registradoEm` é ISO, como vem do banco.
export type Batida = {
  id: string;
  registradoEm: string;
};

// Um dia de trabalho tem 4 batidas: entrada, saída para o almoço, retorno do almoço e saída.
export const BATIDAS_POR_DIA = 4;
export const ROTULOS_DAS_BATIDAS = [
  "Entrada",
  "Saída para almoço",
  "Retorno do almoço",
  "Saída",
] as const;

// Rótulo da batida pela posição dentro do dia (0 é a primeira).
export function rotuloDaBatida(posicao: number): string {
  return ROTULOS_DAS_BATIDAS[posicao] ?? `Batida ${posicao + 1}`;
}

// Uma batida do dia já registrada, com o rótulo do período.
export type Marcacao = {
  tipo: string;
  // "08:20"
  hora: string;
};

// O dia só está completo com as 4 batidas.
export function diaCompleto(batidasDoDia: Batida[]): boolean {
  return batidasDoDia.length === BATIDAS_POR_DIA;
}

export type LocalizacaoDaBatida = {
  latitude: number;
  longitude: number;
  precisao: number | null;
};

const dois = (n: number) => String(n).padStart(2, "0");

// Dia local da batida, em AAAA-MM-DD. Usa o fuso do navegador, que é o do colaborador.
export function dataLocalDeIso(iso: string): string {
  const data = new Date(iso);
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`;
}

// Hora local da batida, em HH:MM.
export function horaLocalDeIso(iso: string): string {
  const data = new Date(iso);
  return `${dois(data.getHours())}:${dois(data.getMinutes())}`;
}

// As batidas agrupadas pelo dia local, em ordem de hora dentro de cada dia.
export function agruparBatidasPorDia(batidas: Batida[]): Map<string, Batida[]> {
  const porDia = new Map<string, Batida[]>();
  const ordenadas = [...batidas].sort(
    (a, b) => Date.parse(a.registradoEm) - Date.parse(b.registradoEm),
  );
  for (const batida of ordenadas) {
    const dia = dataLocalDeIso(batida.registradoEm);
    porDia.set(dia, [...(porDia.get(dia) ?? []), batida]);
  }
  return porDia;
}

// As batidas do dia na ordem em que aconteceram, cada uma com o rótulo do período.
export function marcacoesDoDia(batidasDoDia: Batida[]): Marcacao[] {
  return batidasDoDia.map((batida, indice) => ({
    tipo: rotuloDaBatida(indice),
    hora: horaLocalDeIso(batida.registradoEm),
  }));
}

// Minutos entre cada entrada e a saída seguinte. Uma entrada sem saída (jornada ainda aberta) não conta.
export function minutosTrabalhadosDoDia(batidasDoDia: Batida[]): number {
  let total = 0;
  for (let i = 0; i + 1 < batidasDoDia.length; i += 2) {
    const entrada = Date.parse(batidasDoDia[i]!.registradoEm);
    const saida = Date.parse(batidasDoDia[i + 1]!.registradoEm);
    total += Math.round((saida - entrada) / 60_000);
  }
  return total;
}

export type ParDeMarcacoes = {
  entrada: string;
  // Null quando a entrada ainda não tem saída (jornada em aberto).
  saida: string | null;
  // Minutos entre a entrada e a saída; null quando não há saída.
  saldo: number | null;
};

const minutosDoHorario = (hora: string) => {
  const [horas = 0, minutos = 0] = hora.split(":").map(Number);
  return horas * 60 + minutos;
};

// Cada entrada e a saída seguinte formam um par: é a linha ENTRADA / SAÍDA / SALDO da tela.
export function paresDeMarcacoes(marcacoes: Marcacao[]): ParDeMarcacoes[] {
  const pares: ParDeMarcacoes[] = [];
  for (let i = 0; i < marcacoes.length; i += 2) {
    const entrada = marcacoes[i]!;
    const saida = marcacoes[i + 1] ?? null;
    pares.push({
      entrada: entrada.hora,
      saida: saida?.hora ?? null,
      saldo: saida ? minutosDoHorario(saida.hora) - minutosDoHorario(entrada.hora) : null,
    });
  }
  return pares;
}

// A batida mais recente, ou null quando ainda não há nenhuma.
export function ultimaBatida(batidas: Batida[]): Batida | null {
  let ultima: Batida | null = null;
  for (const batida of batidas) {
    if (!ultima || Date.parse(batida.registradoEm) > Date.parse(ultima.registradoEm))
      ultima = batida;
  }
  return ultima;
}

type LinhaBatida = { id: string; registrado_em: string };

// Até 1.000 batidas mais recentes da pessoa, para a tela e a "Última batida" do modal.
export async function carregarMinhasBatidas(email: string): Promise<Batida[]> {
  const { data, error } = await db
    .from("ponto_batidas")
    .select("id, registrado_em")
    .eq("colaborador_email", email)
    .order("registrado_em", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return ((data ?? []) as LinhaBatida[]).map((b) => ({ id: b.id, registradoEm: b.registrado_em }));
}

// Grava a batida com a localização. A hora é a do servidor, e o RLS recusa batidas com hora fora de agora.
export async function registrarBatida(
  email: string,
  nome: string,
  localizacao: LocalizacaoDaBatida,
): Promise<void> {
  const { error } = await db.from("ponto_batidas").insert({
    colaborador_email: email,
    colaborador_nome: nome,
    latitude: localizacao.latitude,
    longitude: localizacao.longitude,
    precisao: localizacao.precisao,
  });
  if (error) throw error;
}
