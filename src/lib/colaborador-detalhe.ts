import type { SupabaseClient } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

// A tipagem gerada do banco ainda não inclui colaboradores_importados.
const db = supabase as unknown as SupabaseClient<any>;

export type RegistroColaborador = Record<string, string | null> & { id: string };

// Busca um colaborador completo pelo id ou pelo e-mail (usado para abrir o líder).
export async function buscarColaborador(
  identificador: { id: string } | { email: string },
): Promise<RegistroColaborador | null> {
  const consulta = db.from("colaboradores_importados").select("*");
  const { data, error } =
    "id" in identificador
      ? await consulta.eq("id", identificador.id).maybeSingle()
      : await consulta.ilike("email", identificador.email).maybeSingle();
  if (error) throw error;
  return data ?? null;
}

// Campos editáveis pela tela de detalhes. Cada chave é a coluna do banco.
export type CamposEditaveis = {
  nome: string;
  nome_completo: string;
  email: string;
  cargo: string;
  cargo_visivel: string;
  departamento: string;
  unidade: string;
  papel: string;
  situacao: string;
  gestor_direto: string;
  gestor_direto_email: string;
};

export async function atualizarColaborador(id: string, campos: CamposEditaveis) {
  const { error } = await db.from("colaboradores_importados").update(campos).eq("id", id);
  if (error) throw error;
}

// Níveis de acesso. O valor é o que fica gravado em nivel_acesso; o rótulo é o que aparece na tela.
// "bloqueado": papel fixo de uma única conta (TI Maracas). Ninguém consegue atribuí-lo nem removê-lo pela tela.
export const NIVEIS_ACESSO = [
  {
    valor: "desenvolvedor",
    rotulo: "Desenvolvedor do Sistema",
    descricao: "Criador do Sistema. Acesso a toda infraestrutura do sistema.",
    bloqueado: true,
  },
  { valor: "administrador", rotulo: "Administrador", descricao: "Acesso total.", bloqueado: false },
  {
    valor: "gestor",
    rotulo: "Gestor",
    descricao: "Acesso a tudo que diz respeito à sua equipe.",
    bloqueado: false,
  },
  {
    valor: "colaborador",
    rotulo: "Colaborador",
    descricao: "Acesso somente ao que diz respeito a si mesmo e à parte de celebrações (caso exista).",
    bloqueado: false,
  },
  {
    valor: "convidado",
    rotulo: "Visitante",
    descricao:
      "Acesso direcionado exclusivamente ao que for definido, normalmente uma avaliação técnica (ex.: avaliação comportamental tipo DISC).",
    bloqueado: false,
  },
] as const;

export type NivelAcesso = (typeof NIVEIS_ACESSO)[number]["valor"];

export async function atualizarNivelAcesso(id: string, nivel: NivelAcesso) {
  const { error } = await db
    .from("colaboradores_importados")
    .update({ nivel_acesso: nivel })
    .eq("id", id);
  if (error) throw error;
}

// Transfere o cargo de Ouvidor para outro Administrador. A função no banco confere quem pode fazer isso.
export async function transferirOuvidor(destinoId: string) {
  const { error } = await db.rpc("transferir_ouvidor", { destino_id: destinoId });
  if (error) throw error;
}

export const MOTIVOS_DESLIGAMENTO = [
  "Baixa Produtividade/Desempenho",
  "Salário",
  "Nova Oportunidade",
  "Demissão sem justa causa",
  "Demissão com justa causa",
  "Problemas de Saúde",
  "Insatisfação",
  "Insatisfação c/ Chefia",
  "Insatisfação c/ Empresa",
  "Outros",
] as const;

export const TIPOS_DESLIGAMENTO = ["Voluntário", "Involuntário", "Não Classificado"] as const;

export const LIMITE_MOTIVO_OUTROS = 6000;

export type MotivoDesligamento = (typeof MOTIVOS_DESLIGAMENTO)[number];
export type TipoDesligamento = (typeof TIPOS_DESLIGAMENTO)[number];

export type DadosDesligamento = {
  dataDesligamento: string;
  tipo: TipoDesligamento;
  motivo: MotivoDesligamento;
  motivoOutros: string;
};

// Desligamento: marca a situação como Desligado, registra o último dia trabalhado e o motivo.
// O campo "desligamento" recebe "Tipo - Motivo", o mesmo formato usado pelos relatórios.
// A pessoa sai do organograma, do diretório e dos rankings, mas continua no banco.
export async function desligarColaborador(id: string, dados: DadosDesligamento) {
  const descricaoOutros = dados.motivoOutros.trim();
  if (dados.motivo === "Outros" && !descricaoOutros) {
    throw new Error("Descreva o motivo em Outros.");
  }

  const { error } = await db
    .from("colaboradores_importados")
    .update({
      situacao: "Desligado",
      desligamento: `${dados.tipo} - ${dados.motivo}`,
      ultimo_dia_trabalhado: dados.dataDesligamento,
      tipo_desligamento: dados.tipo,
      motivo_desligamento: dados.motivo,
      motivo_desligamento_outros: dados.motivo === "Outros" ? descricaoOutros : "",
    })
    .eq("id", id);
  if (error) throw error;
}

export const MOTIVOS_DESATIVACAO = [
  "Férias",
  "Licença Maternidade",
  "Licença Paternidade",
  "Licença Médica",
  "Lua de Mel",
  "Afastamento",
  "Outros",
] as const;

export type MotivoDesativacao = (typeof MOTIVOS_DESATIVACAO)[number];

// Desativação: afastamento temporário. Marca a situação como Desativado e grava o motivo.
// Não preenche desligamento nem último dia trabalhado, então não entra nos relatórios de turnover.
export async function desativarColaborador(
  id: string,
  dados: { motivo: MotivoDesativacao; motivoOutros: string },
) {
  const descricaoOutros = dados.motivoOutros.trim();
  if (dados.motivo === "Outros" && !descricaoOutros) {
    throw new Error("Descreva o motivo em Outros.");
  }

  const { error } = await db
    .from("colaboradores_importados")
    .update({
      situacao: "Desativado",
      motivo_desativacao: dados.motivo,
      motivo_desativacao_outros: dados.motivo === "Outros" ? descricaoOutros : "",
    })
    .eq("id", id);
  if (error) throw error;
}
