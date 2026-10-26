import { CalendarCheck, Clock, FlaskConical } from "lucide-react";

import type { SelecaoPeriodo } from "@/components/ferias/calendario-anual";
import { dataBr, diaDeRetorno, diasDoPeriodo, ordenarPeriodo } from "@/lib/calendario";
import { REGRA_INICIO_DAS_FERIAS } from "@/lib/ferias-regras";
import {
  ROTULO_STATUS,
  mensagemDaSolicitacao,
  type SolicitacaoFerias,
} from "@/lib/ferias-solicitacao";

const DEMONSTRACAO = (
  <span className="inline-flex items-center gap-1 rounded-full border border-brand/60 px-2 py-0.5 text-xs font-semibold text-brand">
    <FlaskConical className="size-3" aria-hidden />
    Demonstração
  </span>
);

type PropsResumo = {
  selecao: SelecaoPeriodo;
  aoSolicitar: () => void;
  aoLimpar: () => void;
};

// Mostra o que foi escolhido no calendário e os dias calculados, antes de enviar a solicitação.
export function ResumoSelecao({ selecao, aoSolicitar, aoLimpar }: PropsResumo) {
  const periodo =
    selecao.inicio && selecao.fim ? ordenarPeriodo(selecao.inicio, selecao.fim) : null;

  return (
    <div
      role="status"
      className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-brand/50 bg-brand/10 p-4"
    >
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-semibold text-white">
          Solicitar férias {DEMONSTRACAO}
        </p>
        {!selecao.inicio ? (
          <p className="mt-1 text-sm text-white/80">
            Clique no primeiro dia das suas férias. {REGRA_INICIO_DAS_FERIAS}
          </p>
        ) : !periodo ? (
          <p className="mt-1 text-sm text-white/80">
            Início em <strong className="text-white">{dataBr(selecao.inicio)}</strong>. Agora clique
            no último dia.
          </p>
        ) : (
          <p className="mt-1 text-sm text-white/80">
            De <strong className="text-white">{dataBr(periodo.inicio)}</strong> a{" "}
            <strong className="text-white">{dataBr(periodo.fim)}</strong>:{" "}
            <strong className="text-brand">
              {diasDoPeriodo(periodo.inicio, periodo.fim)}{" "}
              {diasDoPeriodo(periodo.inicio, periodo.fim) === 1 ? "dia" : "dias"}
            </strong>{" "}
            de férias, com retorno em{" "}
            <strong className="text-white">{dataBr(diaDeRetorno(periodo.fim))}</strong>.
          </p>
        )}
      </div>
      <div className="ml-auto flex gap-2">
        {selecao.inicio && (
          <button
            type="button"
            onClick={aoLimpar}
            className="rounded-lg px-3 py-2 text-sm text-white/80 transition hover:text-white"
          >
            Limpar
          </button>
        )}
        <button
          type="button"
          disabled={!periodo}
          onClick={aoSolicitar}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CalendarCheck className="size-4" aria-hidden />
          Solicitar férias
        </button>
      </div>
    </div>
  );
}

type PropsCartao = {
  solicitacao: SolicitacaoFerias;
  aoCancelar: () => void;
};

// A solicitação enviada, com o status e a mensagem para o colaborador.
export function CartaoSolicitacao({ solicitacao, aoCancelar }: PropsCartao) {
  return (
    <section
      aria-label="Sua solicitação de férias"
      className="mb-6 rounded-2xl border border-brand bg-panel p-5 shadow-lg shadow-brand/10"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-900">
          <Clock className="size-3.5" aria-hidden />
          {ROTULO_STATUS[solicitacao.status]}
        </span>
        {DEMONSTRACAO}
      </div>
      <p className="mt-3 text-base text-white">{mensagemDaSolicitacao(solicitacao)}</p>
      <p className="mt-2 text-sm text-white/70">
        {solicitacao.dias} {solicitacao.dias === 1 ? "dia" : "dias"} de férias, de{" "}
        {dataBr(solicitacao.inicio)} a {dataBr(solicitacao.fim)}.
      </p>
      <button
        type="button"
        onClick={aoCancelar}
        className="mt-3 text-sm text-white/70 underline-offset-4 transition hover:text-red-400 hover:underline"
      >
        Cancelar solicitação
      </button>
    </section>
  );
}
