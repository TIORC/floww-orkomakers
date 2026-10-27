import { CalendarCheck } from "lucide-react";

import type { SelecaoPeriodo } from "@/components/ferias/calendario-anual";
import { dataBr, diaDeRetorno, diasDoPeriodo, ordenarPeriodo } from "@/lib/calendario";
import { REGRA_EPOCA_DAS_FERIAS, REGRA_INICIO_DAS_FERIAS } from "@/lib/ferias-regras";

type Props = {
  nome: string;
  selecao: SelecaoPeriodo;
  salvando: boolean;
  aoProgramar: () => void;
  aoLimpar: () => void;
};

// Painel de programação: quem programa escolhe o período no calendário. Programar não efetiva as férias.
export function CartaoProgramacao({ nome, selecao, salvando, aoProgramar, aoLimpar }: Props) {
  const periodo = selecao.inicio && selecao.fim ? ordenarPeriodo(selecao.inicio, selecao.fim) : null;

  return (
    <div
      role="status"
      className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-brand bg-brand p-4 text-slate-900"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold">Programar férias de {nome}</p>
        {!selecao.inicio ? (
          <p className="mt-1 text-sm text-slate-900/80">
            Clique no primeiro dia das férias. {REGRA_INICIO_DAS_FERIAS}
          </p>
        ) : !periodo ? (
          <p className="mt-1 text-sm text-slate-900/80">
            Início em <strong className="text-slate-900">{dataBr(selecao.inicio)}</strong>. Agora clique
            no último dia.
          </p>
        ) : (
          <p className="mt-1 text-sm text-slate-900/80">
            De <strong className="text-slate-900">{dataBr(periodo.inicio)}</strong> a{" "}
            <strong className="text-slate-900">{dataBr(periodo.fim)}</strong>:{" "}
            <strong className="text-slate-900">
              {diasDoPeriodo(periodo.inicio, periodo.fim)}{" "}
              {diasDoPeriodo(periodo.inicio, periodo.fim) === 1 ? "dia" : "dias"}
            </strong>{" "}
            de férias, com retorno em{" "}
            <strong className="text-slate-900">{dataBr(diaDeRetorno(periodo.fim))}</strong>.
          </p>
        )}
        <p className="mt-1 text-sm font-bold text-slate-900">{REGRA_EPOCA_DAS_FERIAS}</p>
        <p className="mt-1 text-xs font-semibold text-slate-900/80">
          Isto programa o período. As férias só são efetivadas depois, fora desta tela.
        </p>
      </div>
      <div className="ml-auto flex gap-2">
        {selecao.inicio && (
          <button
            type="button"
            onClick={aoLimpar}
            disabled={salvando}
            className="rounded-lg px-3 py-2 text-sm text-slate-900/80 transition hover:text-slate-900"
          >
            Limpar
          </button>
        )}
        <button
          type="button"
          disabled={!periodo || salvando}
          onClick={aoProgramar}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-brand shadow transition hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CalendarCheck className="size-4" aria-hidden />
          Programar férias
        </button>
      </div>
    </div>
  );
}
