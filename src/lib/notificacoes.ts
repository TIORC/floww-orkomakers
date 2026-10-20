import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

// A tipagem gerada do banco ainda não inclui notificacoes.
const db = supabase as unknown as SupabaseClient<any>;

const LIMITE_LISTA = 30;

export type Notificacao = {
  id: string;
  tipo: string;
  texto: string;
  atorNome: string;
  atorFotoUrl: string;
  lida: boolean;
  criadaEm: string;
};

export async function listarNotificacoes(email: string): Promise<Notificacao[]> {
  const { data, error } = await db
    .from("notificacoes")
    .select("id, tipo, texto, ator_nome, ator_foto_url, lida, criada_em")
    .eq("destinatario_email", email)
    .order("criada_em", { ascending: false })
    .limit(LIMITE_LISTA);
  if (error) throw error;
  return (data ?? []).map((item: Record<string, string | boolean | null>) => ({
    id: String(item["id"]),
    tipo: String(item["tipo"] ?? "geral"),
    texto: String(item["texto"] ?? ""),
    atorNome: String(item["ator_nome"] ?? ""),
    atorFotoUrl: String(item["ator_foto_url"] ?? ""),
    lida: Boolean(item["lida"]),
    criadaEm: String(item["criada_em"] ?? ""),
  }));
}

export async function contarNaoLidas(email: string): Promise<number> {
  const { count, error } = await db
    .from("notificacoes")
    .select("id", { count: "exact", head: true })
    .eq("destinatario_email", email)
    .eq("lida", false);
  if (error) throw error;
  return count ?? 0;
}

export async function marcarTodasComoLidas(email: string) {
  const { error } = await db
    .from("notificacoes")
    .update({ lida: true })
    .eq("destinatario_email", email)
    .eq("lida", false);
  if (error) throw error;
}

// Usado pelas funcionalidades que geram notificações (feedback, pesquisa, curso, moedas...).
export async function registrarNotificacao(params: {
  destinatarioEmail: string;
  tipo: string;
  texto: string;
  atorNome?: string;
  atorFotoUrl?: string | null;
}) {
  const { error } = await db.from("notificacoes").insert({
    destinatario_email: params.destinatarioEmail,
    tipo: params.tipo,
    texto: params.texto,
    ator_nome: params.atorNome ?? "",
    ator_foto_url: params.atorFotoUrl ?? null,
  });
  if (error) throw error;
}

// "há 2 horas", "há 1 dia"... para a lista de notificações.
export function tempoRelativo(dataIso: string, agora = new Date()) {
  const diffSegundos = Math.max(0, Math.floor((agora.getTime() - new Date(dataIso).getTime()) / 1000));
  const minutos = Math.floor(diffSegundos / 60);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} hora${horas > 1 ? "s" : ""}`;
  const dias = Math.floor(horas / 24);
  return `há ${dias} dia${dias > 1 ? "s" : ""}`;
}
