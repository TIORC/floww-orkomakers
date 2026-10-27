import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

// A tipagem gerada do banco ainda não inclui ferias_programadas.
const db = supabase as unknown as SupabaseClient<any>;

export type FeriasProgramadas = {
  id: string;
  inicio: string;
  fim: string;
  programadoPorEmail: string;
};

// Períodos já programados para a pessoa, do mais cedo para o mais tarde. Datas em AAAA-MM-DD.
export async function listarFeriasProgramadas(emailColaborador: string): Promise<FeriasProgramadas[]> {
  const { data, error } = await db
    .from("ferias_programadas")
    .select("id, inicio, fim, programado_por_email")
    .eq("colaborador_email", emailColaborador)
    .order("inicio", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((linha: Record<string, string>) => ({
    id: linha["id"] ?? "",
    inicio: linha["inicio"] ?? "",
    fim: linha["fim"] ?? "",
    programadoPorEmail: linha["programado_por_email"] ?? "",
  }));
}

// Remove uma programação de férias pelo id. Só quem pode programar consegue (regra no banco).
export async function removerFeriasProgramadas(id: string) {
  const { error } = await db.from("ferias_programadas").delete().eq("id", id);
  if (error) throw error;
}

// E-mails, entre os informados, que já têm pelo menos um período de férias programado.
export async function listarEmailsComFeriasProgramadas(emails: string[]): Promise<string[]> {
  if (emails.length === 0) return [];
  const { data, error } = await db
    .from("ferias_programadas")
    .select("colaborador_email")
    .in("colaborador_email", emails);
  if (error) throw error;
  return [...new Set((data ?? []).map((linha: Record<string, string>) => linha["colaborador_email"] ?? ""))];
}

export async function salvarFeriasProgramadas(dados: {
  colaboradorEmail: string;
  colaboradorNome: string;
  inicio: string;
  fim: string;
  programadoPorEmail: string;
}) {
  const { error } = await db.from("ferias_programadas").insert({
    colaborador_email: dados.colaboradorEmail,
    colaborador_nome: dados.colaboradorNome,
    inicio: dados.inicio,
    fim: dados.fim,
    programado_por_email: dados.programadoPorEmail,
  });
  if (error) throw error;
}
