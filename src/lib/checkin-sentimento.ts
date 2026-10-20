import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

// A tipagem gerada do banco ainda não inclui checkin_sentimento.
const db = supabase as unknown as SupabaseClient<any>;

// Dia local no formato AAAA-MM-DD (o check-in vale até a meia-noite).
function hojeIso() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

// Grava o check-in do dia da pessoa logada. Se já houver um hoje, ele é substituído.
export async function registrarCheckin(emocao: string, motivo: string) {
  const { data: authData } = await supabase.auth.getUser();
  const email = authData.user?.email;
  if (!email) throw new Error("Faça login para registrar o sentimento.");

  const { error } = await db.from("checkin_sentimento").upsert(
    {
      colaborador_email: email,
      data: hojeIso(),
      emocao,
      motivo,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "colaborador_email,data" },
  );
  if (error) throw error;
}

export const PESOS_EMOCAO = {
  muito_triste: 1,
  triste: 2,
  neutro: 3,
  feliz: 4,
  muito_feliz: 5,
} as const;

export type EmocaoRelatorio = keyof typeof PESOS_EMOCAO;

export type ResumoHumor = {
  total: number;
  media: number | null;
  contagem: Record<EmocaoRelatorio, number>;
};

export type PeriodoRelatorio = "Todo o período" | "Últimos 7 dias" | "Últimos 30 dias" | "Últimos 90 dias";

const DIAS_POR_PERIODO: Record<PeriodoRelatorio, number | null> = {
  "Todo o período": null,
  "Últimos 7 dias": 7,
  "Últimos 30 dias": 30,
  "Últimos 90 dias": 90,
};

// Data mínima do período, no formato AAAA-MM-DD (null = sem limite).
function dataInicioPeriodo(periodo: PeriodoRelatorio) {
  const dias = DIAS_POR_PERIODO[periodo];
  if (dias === null) return null;
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - (dias - 1));
  const mes = String(inicio.getMonth() + 1).padStart(2, "0");
  const dia = String(inicio.getDate()).padStart(2, "0");
  return `${inicio.getFullYear()}-${mes}-${dia}`;
}

// Resumo agregado do período: total, média (1 a 5) e quantos escolheram cada emoção.
// Não identifica ninguém; só devolve números.
export async function resumoHumor(periodo: PeriodoRelatorio): Promise<ResumoHumor> {
  let consulta = db.from("checkin_sentimento").select("emocao");
  const inicio = dataInicioPeriodo(periodo);
  if (inicio) consulta = consulta.gte("data", inicio);
  const { data, error } = await consulta;
  if (error) throw error;

  const contagem: Record<EmocaoRelatorio, number> = {
    muito_triste: 0,
    triste: 0,
    neutro: 0,
    feliz: 0,
    muito_feliz: 0,
  };
  let soma = 0;
  const linhas = (data ?? []) as { emocao: EmocaoRelatorio }[];
  linhas.forEach((linha) => {
    contagem[linha.emocao] += 1;
    soma += PESOS_EMOCAO[linha.emocao];
  });
  const total = linhas.length;
  return { total, media: total > 0 ? soma / total : null, contagem };
}
