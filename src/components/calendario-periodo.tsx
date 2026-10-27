import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { SelecaoPeriodo } from "@/components/ferias/calendario-anual";
import { DIAS_DA_SEMANA, NOMES_MESES, hojeIso, ordenarPeriodo, paraIso, semanasDoMes } from "@/lib/calendario";
import { cn } from "@/lib/utils";

type Props = {
  selecao: SelecaoPeriodo;
  aoEscolherDia: (iso: string) => void;
};

// Calendário de um mês para escolher um período (início e fim). Dias passados também podem ser escolhidos.
export function CalendarioPeriodo({ selecao, aoEscolherDia }: Props) {
  const hoje = hojeIso();
  const [ano, setAno] = useState(() => Number(hoje.slice(0, 4)));
  const [mes, setMes] = useState(() => Number(hoje.slice(5, 7)) - 1);

  const periodo =
    selecao.inicio && selecao.fim ? ordenarPeriodo(selecao.inicio, selecao.fim) : null;
  const semanas = semanasDoMes(ano, mes);

  function mudarMes(delta: number) {
    const data = new Date(ano, mes + delta, 1);
    setAno(data.getFullYear());
    setMes(data.getMonth());
  }

  return (
    <div className="w-full max-w-xs rounded-xl border border-panel-active bg-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => mudarMes(-1)}
          aria-label="Mês anterior"
          className="flex size-8 items-center justify-center rounded-lg text-white transition hover:text-brand"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <p className="font-display text-sm font-semibold text-white">
          {NOMES_MESES[mes]} de {ano}
        </p>
        <button
          type="button"
          onClick={() => mudarMes(1)}
          aria-label="Próximo mês"
          className="flex size-8 items-center justify-center rounded-lg text-white transition hover:text-brand"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      <table className="w-full table-fixed border-collapse text-center text-xs">
        <thead>
          <tr>
            {DIAS_DA_SEMANA.map((dia, i) => (
              <th key={i} scope="col" className="pb-1 font-semibold text-white/60">
                {dia}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {semanas.map((semana, i) => (
            <tr key={i}>
              {semana.map((dia, j) => {
                if (!dia) return <td key={j} className="p-0.5" />;
                const iso = paraIso(ano, mes, dia);
                const ehInicio = iso === selecao.inicio;
                const ehFim = periodo !== null && iso === periodo.fim;
                const dentro = periodo !== null && iso >= periodo.inicio && iso <= periodo.fim;
                return (
                  <td key={j} className="p-0.5">
                    <button
                      type="button"
                      onClick={() => aoEscolherDia(iso)}
                      aria-pressed={dentro}
                      aria-label={`${dia} de ${NOMES_MESES[mes]} de ${ano}`}
                      className={cn(
                        "mx-auto flex size-7 items-center justify-center rounded-md tabular-nums transition hover:bg-brand/30",
                        j === 0 || j === 6 ? "text-white/50" : "text-white",
                        iso === hoje && "ring-1 ring-brand",
                        dentro && "bg-brand/25 text-white",
                        (ehInicio || ehFim) && "bg-brand font-bold text-slate-900",
                      )}
                    >
                      {dia}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
