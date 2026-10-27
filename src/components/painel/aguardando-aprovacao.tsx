import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import {
  DetalheSolicitacao,
  ROTULO_TIPO,
  type SolicitacaoAviso,
} from "@/components/painel/minhas-solicitacoes";
import { EstadoVazioAvisos } from "@/components/painel/estado-vazio-avisos";
import { decidirAviso } from "@/lib/avisos";
import { useUsuarioLogado } from "@/hooks/use-usuario-logado";

// Avisos pendentes de decisão. Clicar no card abre todos os detalhes. Aprovar ou recusar grava no banco.
export function AguardandoAprovacao({ solicitacoes }: { solicitacoes: SolicitacaoAviso[] }) {
  const queryClient = useQueryClient();
  const { data: usuario } = useUsuarioLogado();
  const [detalhe, setDetalhe] = useState<SolicitacaoAviso | null>(null);
  const [recusandoId, setRecusandoId] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  async function decidir(solicitacao: SolicitacaoAviso, decisao: "aprovado" | "recusado") {
    if (!usuario) return;
    if (decisao === "recusado" && !motivo.trim()) {
      toast.error("Informe o motivo da recusa.");
      return;
    }
    setProcessandoId(solicitacao.id);
    try {
      await decidirAviso(solicitacao.id, decisao, motivo, {
        email: usuario.email,
        nome: usuario.nomeCompleto ?? usuario.nome,
      });
      await queryClient.invalidateQueries({ queryKey: ["avisos-aguardando"] });
      toast.success(decisao === "aprovado" ? "Aviso aprovado." : "Aviso recusado.");
      setRecusandoId(null);
      setMotivo("");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível registrar a decisão.");
    } finally {
      setProcessandoId(null);
    }
  }

  if (solicitacoes.length === 0) {
    return (
      <EstadoVazioAvisos
        variante="aguardando"
        titulo="Tudo em dia"
        texto="Nenhum aviso aguardando a sua decisão no momento."
      />
    );
  }

  return (
    <>
      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {solicitacoes.map((solicitacao) => {
          const recusando = recusandoId === solicitacao.id;
          const processando = processandoId === solicitacao.id;
          return (
            <li key={solicitacao.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setDetalhe(solicitacao)}
                onKeyDown={(evento) => {
                  if (evento.key === "Enter" || evento.key === " ") setDetalhe(solicitacao);
                }}
                className="h-full cursor-pointer rounded-2xl border border-yellow-400/60 bg-panel p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-yellow-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-semibold text-white">{solicitacao.nome}</p>
                    <p className="truncate text-sm text-white/70">{solicitacao.email}</p>
                    <p className="truncate text-sm text-white/70">{solicitacao.setor}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-900">
                    Pendente
                  </span>
                </div>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-panel-label">
                  {ROTULO_TIPO[solicitacao.tipo]}
                </p>
                <p className="mt-1 text-sm text-white/85">
                  <strong className="font-semibold text-white">Período:</strong> {solicitacao.periodo} ·{" "}
                  <strong className="font-semibold text-white">Quantidade:</strong> {solicitacao.quantidade}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-white/75">{solicitacao.descricao}</p>

                {/* Estes controles não devem abrir o detalhe do card. */}
                <div
                  className="mt-5 grid gap-3"
                  onClick={(evento) => evento.stopPropagation()}
                  onKeyDown={(evento) => evento.stopPropagation()}
                >
                  {recusando && (
                    <label className="grid gap-1.5 text-sm font-semibold text-white">
                      Motivo da recusa *
                      <textarea
                        value={motivo}
                        onChange={(evento) => setMotivo(evento.target.value)}
                        rows={3}
                        placeholder="Explique o motivo da recusa"
                        className="rounded-lg border border-panel-active bg-background px-3 py-2 text-sm font-normal text-white outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      />
                    </label>
                  )}

                  <div className="flex flex-wrap justify-end gap-3">
                    {recusando ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setRecusandoId(null);
                            setMotivo("");
                          }}
                          className="rounded-lg border border-panel-active px-4 py-2 text-sm font-semibold text-white transition hover:bg-panel-active"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={processando}
                          onClick={() => decidir(solicitacao, "recusado")}
                          className="inline-flex items-center gap-2 rounded-lg bg-red-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
                        >
                          <X className="size-4" aria-hidden />
                          Confirmar recusa
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={processando}
                          onClick={() => {
                            setRecusandoId(solicitacao.id);
                            setMotivo("");
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-red-700 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-950/40 disabled:opacity-60"
                        >
                          <X className="size-4" aria-hidden />
                          Recusar
                        </button>
                        <button
                          type="button"
                          disabled={processando}
                          onClick={() => decidir(solicitacao, "aprovado")}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                        >
                          <Check className="size-4" aria-hidden />
                          Aprovar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <DetalheSolicitacao solicitacao={detalhe} aoFechar={() => setDetalhe(null)} />
    </>
  );
}
