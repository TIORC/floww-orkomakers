import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  DIAS_DA_SEMANA,
  NOMES_MESES,
  hojeIso,
  ordenarPeriodo,
  paraIso,
  semanasDoMes,
} from "@/lib/calendario";
import { nomeDoFeriado } from "@/lib/feriados";
import { cn } from "@/lib/utils";

export type SelecaoPeriodo = { inicio: string | null; fim: string | null };

type Props = {
  ano: number;
  aoMudarAno: (ano: number) => void;
  // Com `aoEscolherDia`, os dias viram botões (dias passados ficam desabilitados) e o período escolhido é destacado.
  selecao?: SelecaoPeriodo;
  aoEscolherDia?: (iso: string) => void;
  // Datas que não podem ser o primeiro dia do período: devolve o motivo, ou null se pode. Não vale para o último dia.
  motivoDeBloqueioDoInicio?: (iso: string) => string | null;
  // Períodos já programados para a pessoa; aparecem com contorno, sem se confundir com a seleção.
  programados?: PeriodoProgramadoCalendario[];
  // Relatórios podem olhar datas passadas; a programação de férias não.
  permitirPassado?: boolean;
};

export type PeriodoProgramadoCalendario = { inicio: string; fim: string };

type PropsMes = {
  ano: number;
  mes: number;
  hoje: string;
  selecao: SelecaoPeriodo | undefined;
  previa: string | null;
  aoEscolherDia: ((iso: string) => void) | undefined;
  motivoDeBloqueioDoInicio: ((iso: string) => string | null) | undefined;
  programados: PeriodoProgramadoCalendario[];
  permitirPassado: boolean;
  aoPassarPor: (iso: string | null) => void;
};

function Mes({
  ano,
  mes,
  hoje,
  selecao,
  previa,
  aoEscolherDia,
  motivoDeBloqueioDoInicio,
  programados,
  permitirPassado,
  aoPassarPor,
}: PropsMes) {
  const semanas = semanasDoMes(ano, mes);

  // Enquanto só o início foi escolhido, o dia sob o mouse mostra como ficaria o período.
  const periodo =
    selecao?.inicio && selecao.fim
      ? ordenarPeriodo(selecao.inicio, selecao.fim)
      : selecao?.inicio && previa
        ? ordenarPeriodo(selecao.inicio, previa)
        : null;
  const inicioDoPeriodo = periodo?.inicio ?? selecao?.inicio ?? null;
  // Só se escolhe o primeiro dia quando ainda não há um início esperando o fim.
  const escolhendoInicio = !(selecao?.inicio && !selecao.fim);

  return (
    <section
      aria-label={`${NOMES_MESES[mes]} de ${ano}`}
      className="rounded-2xl border border-panel-active bg-panel p-4"
    >
      <h3 className="mb-3 font-display text-base font-semibold text-white">{NOMES_MESES[mes]}</h3>
      <table className="w-full table-fixed border-collapse text-center text-sm">
        <thead>
          <tr>
            {DIAS_DA_SEMANA.map((dia, i) => (
              <th
                key={i}
                scope="col"
                className={cn(
                  "pb-2 text-xs font-semibold",
                  i === 0 || i === 6 ? "text-brand/80" : "text-white/60",
                )}
              >
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
                const passado = !permitirPassado && iso < hoje;
                const ehInicio = iso === inicioDoPeriodo;
                const ehFim = periodo !== null && iso === periodo.fim;
                const dentro = periodo !== null && iso >= periodo.inicio && iso <= periodo.fim;
                const programado = programados.some((p) => iso >= p.inicio && iso <= p.fim);
                const feriado = nomeDoFeriado(iso);
                const bloqueio = escolhendoInicio ? motivoDeBloqueioDoInicio?.(iso) : null;
                const desabilitado = passado || !!bloqueio;
                const textoFeriado = feriado
                  ? `${dia} de ${NOMES_MESES[mes]}: ${feriado}`
                  : undefined;
                const dica = bloqueio ?? textoFeriado;
                const classes = cn(
                  "mx-auto flex size-8 items-center justify-center rounded-lg tabular-nums",
                  j === 0 || j === 6 ? "text-white/50" : "text-white",
                  // Feriado em vermelho, mesmo que caia no fim de semana.
                  feriado && "bg-red-500/15 font-semibold text-red-400",
                  iso === hoje && "ring-2 ring-brand",
                  dentro && "bg-brand/25 text-white",
                  programado && "ring-1 ring-inset ring-brand",
                  (ehInicio || ehFim) && "bg-brand font-bold text-slate-900",
                );
                return (
                  <td key={j} className="p-0.5">
                    {aoEscolherDia ? (
                      <button
                        type="button"
                        disabled={desabilitado}
                        aria-pressed={dentro}
                        title={dica}
                        aria-label={`${dia} de ${NOMES_MESES[mes]} de ${ano}${feriado ? `, feriado: ${feriado}` : ""}${bloqueio ? `. ${bloqueio}` : ""}`}
                        onClick={() => aoEscolherDia(iso)}
                        onMouseEnter={() => aoPassarPor(iso)}
                        onMouseLeave={() => aoPassarPor(null)}
                        className={cn(
                          classes,
                          "transition",
                          passado
                            ? "cursor-not-allowed opacity-40"
                            : bloqueio
                              ? "cursor-not-allowed line-through opacity-50"
                              : "cursor-pointer hover:bg-brand/40",
                        )}
                      >
                        {dia}
                      </button>
                    ) : (
                      <span title={dica} className={classes}>
                        {dia}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// Calendário do ano todo: os 12 meses lado a lado, com navegação entre anos e o dia de hoje destacado.
// Quando recebe `aoEscolherDia`, também permite escolher um período clicando no primeiro e no último dia.
export function CalendarioAnual({
  ano,
  aoMudarAno,
  selecao,
  aoEscolherDia,
  motivoDeBloqueioDoInicio,
  programados = [],
  permitirPassado = false,
}: Props) {
  const hoje = hojeIso();
  const anoAtual = Number(hoje.slice(0, 4));
  const [previa, setPrevia] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => aoMudarAno(ano - 1)}
          aria-label="Ano anterior"
          className="flex size-9 items-center justify-center rounded-lg border border-panel-active text-white transition hover:border-brand hover:text-brand"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <h2 className="min-w-16 text-center font-display text-2xl font-semibold text-white">
          {ano}
        </h2>
        <button
          type="button"
          onClick={() => aoMudarAno(ano + 1)}
          aria-label="Próximo ano"
          className="flex size-9 items-center justify-center rounded-lg border border-panel-active text-white transition hover:border-brand hover:text-brand"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
        {ano !== anoAtual && (
          <button
            type="button"
            onClick={() => aoMudarAno(anoAtual)}
            className="rounded-lg px-3 py-1.5 text-sm text-white/70 transition hover:text-brand"
          >
            Voltar para {anoAtual}
          </button>
        )}
        <span className="ml-auto inline-flex items-center gap-2 text-sm text-white/70">
          <span className="size-3 rounded ring-1 ring-inset ring-brand" aria-hidden />
          Férias programadas
        </span>
        <span className="inline-flex items-center gap-2 text-sm text-white/70">
          <span className="size-3 rounded bg-red-500/40 ring-1 ring-red-400" aria-hidden />
          Feriado (passe o mouse para ver o nome)
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {NOMES_MESES.map((_, mes) => (
          <Mes
            key={mes}
            ano={ano}
            mes={mes}
            hoje={hoje}
            selecao={selecao}
            previa={previa}
            aoEscolherDia={aoEscolherDia}
            motivoDeBloqueioDoInicio={motivoDeBloqueioDoInicio}
            programados={programados}
            permitirPassado={permitirPassado}
            aoPassarPor={setPrevia}
          />
        ))}
      </div>
    </div>
  );
}
