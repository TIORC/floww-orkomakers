import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export const ETAPAS_PROCESSO = [
  "Cadastro Geral",
  "Abertura da Vaga",
  "Análise dos Currículos",
  "Entrevistas",
  "Conclusão",
  "Fechamento da Vaga",
] as const;

export function TrilhaProcesso({
  etapaAtual = 1,
  className,
}: {
  etapaAtual?: number;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <ol
        aria-label="Etapas do processo seletivo"
        className="flex min-w-max items-start px-4 py-4"
      >
        {ETAPAS_PROCESSO.map((etapa, indice) => {
          const numero = indice + 1;
          const concluida = numero < etapaAtual;
          const atual = numero === etapaAtual;

          return (
            <li key={etapa} className="flex min-w-0 items-start">
              <div className="flex w-24 shrink-0 flex-col items-center gap-2 sm:w-28">
                <span
                  aria-current={atual ? "step" : undefined}
                  className={cn(
                    "relative grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors",
                    concluida && "bg-amber-400 text-slate-900",
                    atual &&
                      "animate-pulse bg-amber-400 font-bold text-slate-900 shadow-[0_0_14px_2px_oklch(0.87_0.17_91/0.6)]",
                    !concluida && !atual &&
                      "border border-dashed border-slate-300 bg-slate-100 text-slate-500",
                  )}
                >
                  {concluida ? <Check className="size-4" aria-hidden /> : numero}
                </span>
                <span
                  className={cn(
                    "text-center text-[0.7rem] font-medium leading-tight",
                    atual && "font-semibold text-slate-900",
                    !atual && "text-slate-500",
                  )}
                >
                  {etapa}
                </span>
                <span className="sr-only">
                  Etapa {numero} de {ETAPAS_PROCESSO.length}
                </span>
              </div>
              {numero < ETAPAS_PROCESSO.length ? (
                <span
                  aria-hidden
                  className={cn(
                    "mt-[1.125rem] h-0.5 w-6 shrink-0 rounded-full sm:w-10",
                    concluida ? "bg-amber-400" : "bg-slate-300",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}