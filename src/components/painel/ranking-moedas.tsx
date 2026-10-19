import { useState } from "react";
import { Coins } from "lucide-react";

import { cn } from "@/lib/utils";

const TITULO_RANKING = "ranking-moedas-titulo";

type Aba = "colaboradores" | "gestores";

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: "colaboradores", rotulo: "Colaboradores" },
  { id: "gestores", rotulo: "Gestores" },
];

// Sem dados por enquanto: a lista fica vazia até a importação dos colaboradores.
const ENTRADAS: never[] = [];

export function RankingMoedas() {
  const [aba, setAba] = useState<Aba>("colaboradores");
  const saldo = 0;

  return (
    <section aria-labelledby={TITULO_RANKING} className="w-full max-w-[800px]">
      <h2 id={TITULO_RANKING} className="ml-8 font-display text-xl font-semibold text-muted-foreground">
        Ranking de Gameficação! - Acompanhe seus Floww Coins!!
      </h2>

      <div className="mt-4 rounded-2xl bg-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-panel-active bg-background p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold text-foreground">Colaborador</p>
              <p className="truncate text-xs font-semibold text-brand">Cargo não informado</p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-panel-active px-4 py-2">
            <Coins className="size-4 shrink-0 text-brand" aria-hidden />
            <span className="font-display text-base font-bold text-foreground">{saldo}</span>
            <span className="text-xs font-semibold text-panel-text">Floww Coins</span>
          </div>
        </div>

        <div role="tablist" className="mt-5 grid w-full grid-cols-2 rounded-lg bg-background p-1 sm:w-96">
          {ABAS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={aba === item.id}
              onClick={() => setAba(item.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-semibold transition",
                aba === item.id ? "bg-panel-active text-brand" : "text-panel-text hover:text-foreground",
              )}
            >
              {item.rotulo}
            </button>
          ))}
        </div>

        {ENTRADAS.length === 0 ? (
          <p className="mt-4 py-8 text-center text-sm text-panel-text">
            {aba === "colaboradores" ? "Nenhum colaborador cadastrado." : "Nenhum gestor cadastrado."}
          </p>
        ) : null}
      </div>
    </section>
  );
}
