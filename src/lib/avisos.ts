import type { SupabaseClient } from "@supabase/supabase-js";

import type { SolicitacaoAviso, StatusSolicitacao, TipoSolicitacao } from "@/components/painel/minhas-solicitacoes";
import { supabase } from "@/integrations/supabase/client";

// A tipagem gerada do banco ainda não inclui a tabela avisos.
const db = supabase as unknown as SupabaseClient<any>;

// Aceita AAAA-MM-DD (campo date) e devolve DD/MM/AAAA.
function dataBr(iso: string | undefined) {
  if (!iso) return "";
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : iso;
}

const ROTULO_AUSENCIA: Record<string, string> = {
  "dia-inteiro": "Dia inteiro",
  manha: "Manhã",
  tarde: "Tarde",
  personalizado: "Horário personalizado",
};

// Envia um aviso novo. O RLS no banco garante que quem envia é o próprio solicitante.
export async function criarAviso(dados: {
  tipo: TipoSolicitacao;
  solicitanteEmail: string;
  solicitanteNome: string;
  setor: string;
  gestorEmail: string | null;
  payload: Record<string, string>;
}) {
  const { error } = await db.from("avisos").insert({
    tipo: dados.tipo,
    solicitante_email: dados.solicitanteEmail,
    solicitante_nome: dados.solicitanteNome,
    setor: dados.setor,
    gestor_email: dados.gestorEmail,
    payload: dados.payload,
  });
  if (error) throw error;
}

// Converte uma linha do banco no formato que as telas mostram.
function mapearAviso(linha: Record<string, unknown>): SolicitacaoAviso {
  const payload = (linha["payload"] ?? {}) as Record<string, string>;
  const tipo = linha["tipo"] as TipoSolicitacao;
  const gestorEmail = (linha["gestor_email"] as string | null) ?? "";
  const status = linha["status"] as StatusSolicitacao;

  const periodo = payload["data"]
    ? dataBr(payload["data"])
    : [payload["dataInicial"], payload["dataFinal"]]
        .map(dataBr)
        .filter(Boolean)
        .join(" a ") || "";

  const quantidade =
    tipo === "ausencia"
      ? (ROTULO_AUSENCIA[payload["tipoAusencia"] ?? ""] ?? "")
      : (payload["horasPrevistas"] || payload["horas"] || "");

  return {
    id: linha["id"] as string,
    nome: (linha["solicitante_nome"] as string) || (linha["solicitante_email"] as string),
    email: linha["solicitante_email"] as string,
    setor: (linha["setor"] as string) || "",
    tipo,
    status,
    motivoRecusa: (linha["motivo_recusa"] as string) || undefined,
    decididoPor: (linha["decidido_por_nome"] as string) || undefined,
    criadoEm: linha["criado_em"] ? dataBr(String(linha["criado_em"])) : "",
    periodo,
    quantidade,
    descricao: payload["descricao"] || payload["observacoes"] || "",
    motivo: payload["motivo"] || "",
    emailLider: gestorEmail || "RH e administradores",
  };
}

// Avisos enviados pela própria pessoa, do mais recente para o mais antigo.
export async function listarMeusAvisos(email: string): Promise<SolicitacaoAviso[]> {
  const { data, error } = await db
    .from("avisos")
    .select("*")
    .eq("solicitante_email", email)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapearAviso);
}

// Avisos pendentes que chegam a quem está logado (o RLS limita a sua equipe, ou o RH quando não há gestor).
export async function listarAvisosParaAprovar(): Promise<SolicitacaoAviso[]> {
  const { data, error } = await db
    .from("avisos")
    .select("*")
    .eq("status", "pendente")
    .order("criado_em", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapearAviso);
}

// Aprova ou recusa um aviso pendente. Recusar exige o motivo.
export async function decidirAviso(
  id: string,
  decisao: "aprovado" | "recusado",
  motivoRecusa: string,
  decididoPor: { email: string; nome: string },
) {
  const { error } = await db
    .from("avisos")
    .update({
      status: decisao,
      motivo_recusa: decisao === "recusado" ? motivoRecusa.trim() : "",
      decidido_por_email: decididoPor.email,
      decidido_por_nome: decididoPor.nome,
      decidido_em: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pendente");
  if (error) throw error;
}
