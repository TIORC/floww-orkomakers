import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/avaliacoes")({
  head: () => ({
    meta: [{ title: "Avaliações de desempenho — Orcoma Orkomakers" }],
  }),
  component: Avaliacoes,
});

const ABAS = ["Autoavaliações", "Gerenciar avaliações", "Comitês de calibragem"] as const;
type Aba = (typeof ABAS)[number];

const COLUNAS = [
  "Nome",
  "Prazo Autoavaliação",
  "Avaliadores/pares",
  "Realizada",
  "Resultado final",
  "Tipo de Avaliação",
  "",
];

// Sem dados por enquanto: a tabela fica vazia até as avaliações serem importadas.
const AVALIACOES: never[] = [];

function Avaliacoes() {
  const [aba, setAba] = useState<Aba>("Autoavaliações");
  const [busca, setBusca] = useState("");

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <h1 className="font-display text-2xl font-bold text-foreground">Avaliações de desempenho</h1>
        <p className="mt-1 text-sm text-panel-text">
          Aqui estão as avaliações de desempenho criadas na sua empresa onde você pode realizar a sua autoavaliação ou
          ver os resultados.
        </p>

        <div role="tablist" className="mt-8 flex gap-6 border-b border-panel-active">
          {ABAS.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={aba === item}
              onClick={() => setAba(item)}
              className={cn(
                "-mb-px border-b-2 pb-3 text-sm font-semibold transition",
                aba === item
                  ? "border-brand text-brand"
                  : "border-transparent text-panel-text hover:text-foreground",
              )}
            >
              {item}
            </button>
          ))}
        </div>

        <section className="mt-8 rounded-2xl bg-panel p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Minhas avaliações como participante</h2>
          <p className="mt-1 text-sm text-panel-text">Aqui você encontra todas as avaliações que você foi participante.</p>

          <div className="mt-6 flex justify-end">
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              aria-label="Buscar avaliações"
              className="h-9 w-64 rounded-md border border-panel-active bg-background px-3 text-sm text-foreground outline-none placeholder:text-panel-label focus-visible:ring-2 focus-visible:ring-brand"
              placeholder="Buscar"
            />
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-panel-active text-center text-xs font-semibold text-panel-text">
                  {COLUNAS.map((coluna, indice) => (
                    <th key={indice} className="px-3 py-3 font-semibold">
                      {coluna}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {AVALIACOES.length === 0 ? (
                  <tr>
                    <td colSpan={COLUNAS.length} className="py-10 text-center text-panel-text">
                      Nenhuma avaliação encontrada.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-panel-active pt-4 text-sm text-panel-text">
            <span>Mostrando de 0 até 0 de 0 registros</span>
            <div className="flex items-center gap-3">
              <button type="button" disabled className="text-panel-label disabled:cursor-not-allowed">
                Anterior
              </button>
              <button type="button" disabled className="text-panel-label disabled:cursor-not-allowed">
                Próximo
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
