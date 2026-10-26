import { dataBr, diaDeRetorno, diasDoPeriodo, ordenarPeriodo } from "@/lib/calendario";

// Demonstração: a solicitação fica guardada só neste navegador. Falta ligar ao banco e ao fluxo de aprovação do líder.
export type StatusFerias = "pendente_lider";

export const ROTULO_STATUS: Record<StatusFerias, string> = {
  pendente_lider: "Pendente de Aprovação do Líder",
};

export type SolicitacaoFerias = {
  // "2026-11-10"
  inicio: string;
  fim: string;
  // Dias corridos, contando o primeiro e o último.
  dias: number;
  // Dia de voltar ao trabalho.
  retorno: string;
  status: StatusFerias;
  liderNome: string;
  criadaEm: string;
};

// Monta a solicitação a partir dos dois dias clicados (em qualquer ordem). Entra como pendente do líder.
export function criarSolicitacao(
  primeiroDia: string,
  segundoDia: string,
  liderNome: string,
  agora: Date = new Date(),
): SolicitacaoFerias {
  const { inicio, fim } = ordenarPeriodo(primeiroDia, segundoDia);
  return {
    inicio,
    fim,
    dias: diasDoPeriodo(inicio, fim),
    retorno: diaDeRetorno(fim),
    status: "pendente_lider",
    liderNome,
    criadaEm: agora.toISOString(),
  };
}

export function mensagemDaSolicitacao(s: SolicitacaoFerias): string {
  return `Você solicitou as suas férias para o dia ${dataBr(s.inicio)} com retorno para o dia ${dataBr(s.retorno)}. Você será informado quando houver aprovação de ${s.liderNome}.`;
}

const chave = (email: string) => `ferias-solicitacao-demo:${email.toLowerCase()}`;

export function carregarSolicitacao(email: string): SolicitacaoFerias | null {
  try {
    const texto = window.localStorage.getItem(chave(email));
    return texto ? (JSON.parse(texto) as SolicitacaoFerias) : null;
  } catch {
    return null;
  }
}

export function salvarSolicitacao(email: string, solicitacao: SolicitacaoFerias | null) {
  try {
    if (solicitacao) window.localStorage.setItem(chave(email), JSON.stringify(solicitacao));
    else window.localStorage.removeItem(chave(email));
  } catch {
    // Sem armazenamento local (navegação privada, por exemplo), a solicitação vale só até recarregar.
  }
}
