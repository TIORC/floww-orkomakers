import { useState } from "react";
import { Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EstadoVazioAvisos } from "@/components/painel/estado-vazio-avisos";
import { cn } from "@/lib/utils";

export type TipoSolicitacao = "hora_extra" | "ausencia" | "retrabalho";
export type StatusSolicitacao = "pendente" | "aprovado" | "recusado";

export type SolicitacaoAviso = {
  id: string;
  nome: string;
  email: string;
  setor: string;
  tipo: TipoSolicitacao;
  status: StatusSolicitacao;
  // Preenchido só quando a solicitação foi recusada.
  motivoRecusa?: string | undefined;
  // Quem aprovou ou recusou. Vazio enquanto estiver pendente.
  decididoPor?: string | undefined;
  // Dados do formulário
  criadoEm: string;
  periodo: string;
  quantidade: string;
  descricao: string;
  motivo: string;
  emailLider: string;
};

export const ROTULO_TIPO: Record<TipoSolicitacao, string> = {
  hora_extra: "Aviso de Horas Extra",
  ausencia: "Aviso de Ausência",
  retrabalho: "Aviso de Retrabalho",
};

export const ESTILO_STATUS: Record<StatusSolicitacao, { rotulo: string; classes: string }> = {
  pendente: { rotulo: "Pendente", classes: "bg-yellow-400 text-slate-900" },
  aprovado: { rotulo: "Permitido", classes: "bg-emerald-800 text-white" },
  recusado: { rotulo: "Negado", classes: "bg-red-900 text-white" },
};

// DEMONSTRAÇÃO: dados fictícios só para ver o visual. Serão trocados pelos avisos gravados no banco.
export const SOLICITACOES_DEMONSTRATIVAS: SolicitacaoAviso[] = [
  {
    id: "1",
    nome: "Ana Beatriz Souza",
    email: "ana.souza@orcoma.com.br",
    setor: "Departamento Comercial",
    tipo: "hora_extra",
    status: "aprovado",
    decididoPor: "Raimundo Cláudio",
    criadoEm: "12/01/2027",
    periodo: "11/01/2027 a 11/01/2027",
    quantidade: "3h",
    descricao: "Fechamento de contratos do trimestre com a equipe de faturamento.",
    motivo: "Prazo de entrega ao cliente.",
    emailLider: "raimundo.claudio@orcoma.com.br",
  },
  {
    id: "4",
    nome: "Daniela Ferreira",
    email: "daniela.ferreira@orcoma.com.br",
    setor: "Departamento Contábil",
    tipo: "hora_extra",
    status: "pendente",
    criadoEm: "16/01/2027",
    periodo: "16/01/2027",
    quantidade: "4h",
    descricao: "Fechamento mensal de conciliações bancárias.",
    motivo: "Volume de lançamentos acima do previsto.",
    emailLider: "geane.lopes@orcoma.com.br",
  },
  {
    id: "2",
    nome: "Bruno Henrique Lima",
    email: "bruno.lima@orcoma.com.br",
    setor: "Departamento TI/Desenvolvimento",
    tipo: "retrabalho",
    status: "pendente",
    criadoEm: "15/01/2027",
    periodo: "14/01/2027",
    quantidade: "2h",
    descricao: "Correção de integração de pagamentos que falhou em produção.",
    motivo: "Erro de validação não identificado nos testes.",
    emailLider: "welder.silva@orcoma.com.br",
  },
  {
    id: "3",
    nome: "Camila Ferreira",
    email: "camila.ferreira@orcoma.com.br",
    setor: "Departamento Contábil",
    tipo: "ausencia",
    status: "recusado",
    motivoRecusa: "Período sobreposto a outra ausência já aprovada.",
    decididoPor: "Geane Lopes",
    criadoEm: "08/01/2027",
    periodo: "18/01/2027 a 19/01/2027",
    quantidade: "Dia inteiro",
    descricao: "Consulta médica e exames.",
    motivo: "Atendimento de saúde.",
    emailLider: "geane.lopes@orcoma.com.br",
  },
];

function DetalheLinha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{rotulo}</dt>
      <dd className="mt-0.5 break-words text-sm text-slate-900">{valor}</dd>
    </div>
  );
}

// Janela com todos os dados de um aviso. Usada tanto na lista do próprio solicitante quanto na de aprovação.
export function DetalheSolicitacao({
  solicitacao,
  aoFechar,
}: {
  solicitacao: SolicitacaoAviso | null;
  aoFechar: () => void;
}) {
  return (
    <Dialog open={solicitacao !== null} onOpenChange={(aberto) => !aberto && aoFechar()}>
      <DialogContent className="w-[min(72rem,95vw)] max-w-none bg-white text-slate-900">
        {solicitacao && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-slate-900">{ROTULO_TIPO[solicitacao.tipo]}</DialogTitle>
              <DialogDescription className="text-slate-500">Enviado em {solicitacao.criadoEm}</DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{solicitacao.nome}</p>
              <span
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                  ESTILO_STATUS[solicitacao.status].classes,
                )}
              >
                {ESTILO_STATUS[solicitacao.status].rotulo}
              </span>
            </div>

            {solicitacao.decididoPor && (
              <p className="text-sm text-slate-700">
                {solicitacao.status === "aprovado" ? "Permitido" : "Negado"} por{" "}
                <strong className="font-semibold text-slate-900">{solicitacao.decididoPor}</strong>
              </p>
            )}

            {solicitacao.status === "recusado" && solicitacao.motivoRecusa && (
              <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
                <strong className="font-semibold">Motivo da negação:</strong> {solicitacao.motivoRecusa}
              </p>
            )}

            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetalheLinha rotulo="E-mail" valor={solicitacao.email} />
              <DetalheLinha rotulo="Setor" valor={solicitacao.setor} />
              <DetalheLinha rotulo="Período" valor={solicitacao.periodo} />
              <DetalheLinha rotulo="Quantidade" valor={solicitacao.quantidade} />
              <DetalheLinha rotulo="Líder do setor" valor={solicitacao.emailLider} />
            </dl>
            <dl className="grid gap-4">
              <DetalheLinha rotulo="Descrição" valor={solicitacao.descricao} />
              <DetalheLinha rotulo="Motivo" valor={solicitacao.motivo} />
            </dl>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Lista das solicitações da própria pessoa. Clicar num card abre o detalhe.
// Administradores (podeExcluir) veem o botão para excluir a própria solicitação.
export function MinhasSolicitacoes({
  solicitacoes,
  aoExcluir,
}: {
  solicitacoes: SolicitacaoAviso[];
  // Presente só para administradores: exclui a solicitação e atualiza a lista.
  aoExcluir?: ((id: string) => Promise<void>) | undefined;
}) {
  const [detalhe, setDetalhe] = useState<SolicitacaoAviso | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  async function excluir(solicitacao: SolicitacaoAviso) {
    if (!aoExcluir) return;
    if (!window.confirm("Excluir esta solicitação? Essa ação não pode ser desfeita.")) return;
    setExcluindoId(solicitacao.id);
    try {
      await aoExcluir(solicitacao.id);
    } finally {
      setExcluindoId(null);
    }
  }

  if (solicitacoes.length === 0) {
    return (
      <EstadoVazioAvisos
        variante="minhas"
        titulo="Nenhuma solicitação por aqui"
        texto="Quando você enviar um aviso, ele aparece nesta lista com o status de aprovação."
      />
    );
  }

  return (
    <>
      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {solicitacoes.map((solicitacao) => {
          const status = ESTILO_STATUS[solicitacao.status];
          return (
            <li key={solicitacao.id}>
              <button
                type="button"
                onClick={() => setDetalhe(solicitacao)}
                className="w-full rounded-2xl border border-panel-active bg-panel p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-semibold text-white">{solicitacao.nome}</p>
                    <p className="truncate text-sm text-white/70">{solicitacao.email}</p>
                    <p className="truncate text-sm text-white/70">{solicitacao.setor}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
                      status.classes,
                    )}
                  >
                    {status.rotulo}
                  </span>
                </div>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-panel-label">
                  {ROTULO_TIPO[solicitacao.tipo]}
                </p>

                {solicitacao.decididoPor && (
                  <p className="mt-1 text-sm text-white/80">
                    {solicitacao.status === "aprovado" ? "Permitido" : "Negado"} por{" "}
                    <strong className="font-semibold text-white">{solicitacao.decididoPor}</strong>
                  </p>
                )}

                {solicitacao.status === "recusado" && solicitacao.motivoRecusa && (
                  <p className="mt-2 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                    <strong className="font-semibold">Motivo da negação:</strong> {solicitacao.motivoRecusa}
                  </p>
                )}
              </button>
              {aoExcluir && (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    aria-label="Excluir solicitação"
                    title="Excluir solicitação"
                    disabled={excluindoId === solicitacao.id}
                    onClick={() => excluir(solicitacao)}
                    className="rounded-full p-1.5 text-panel-label transition hover:text-red-400 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <DetalheSolicitacao solicitacao={detalhe} aoFechar={() => setDetalhe(null)} />
    </>
  );
}
