import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Coins, Search } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gamificacao")({
  head: () => ({
    meta: [{ title: "Gamificação — Orcoma Orkomakers" }],
  }),
  component: GamificacaoPage,
});

// Tabela de pontuação por ação (a mesma do floww-hr-portal).
const ACOES_GAMIFICACAO = [
  { descricao: "Acesso diário à plataforma", pontos: 100 },
  { descricao: "Alterar Avatar/Foto do perfil (pontuação única)", pontos: 10 },
  { descricao: "Responder Pesquisa de Engajamento", pontos: 200 },
  { descricao: "Responder Pesquisa de Satisfação", pontos: 500 },
  { descricao: "Responder Pesquisa Rápida", pontos: 500 },
  { descricao: "Responder Termômetro de Humor", pontos: 50 },
  { descricao: "Realizar check-in em um Objetivo", pontos: 100 },
  { descricao: "Celebrar", pontos: 10 },
  { descricao: "Enviar Feedback", pontos: 300 },
  { descricao: "Finalizar 1:1", pontos: 200 },
  { descricao: "Plano de Desenvolvimento (PDI) vigente", pontos: 500 },
  { descricao: "Responder uma Super Pesquisa", pontos: 500 },
];

const FILTROS = [
  { value: "todos", label: "Todos" },
  { value: "colaborador", label: "Colaboradores" },
  { value: "gestor", label: "Gestores" },
] as const;

// Sem dados por enquanto: o ranking chega da fonte real depois.
const RANKING: never[] = [];

function GamificacaoPage() {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["value"]>("todos");

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <section className="rounded-2xl border border-panel-active bg-panel p-6 sm:p-8">
          <header>
            <h1 className="font-display text-3xl font-semibold text-white">Ranking de Gamificação</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              Veja quanto vale cada ação para ganhar Floww Coins, acompanhe o ranking completo e acesse seu extrato
              individual para conferir o histórico dos pontos que você acumulou.
            </p>
          </header>

          <section className="mt-8" aria-labelledby="acoes-title">
            <h2 id="acoes-title" className="font-display text-lg font-semibold text-white">
              Ação e valor em pontos
            </h2>
            <ul className="mt-3 grid gap-x-10 gap-y-1 text-sm text-white/80 sm:grid-cols-2">
              {ACOES_GAMIFICACAO.map((acao) => (
                <li key={acao.descricao} className="flex justify-between gap-3 border-b border-panel-active py-1.5">
                  <span>{acao.descricao}</span>
                  <span className="shrink-0 font-semibold text-brand">{acao.pontos} Floww Coins</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10" aria-labelledby="ranking-title">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="ranking-title" className="font-display text-xl font-semibold text-white">
                  Ranking completo
                </h2>
                <p className="mt-1 text-sm text-white/80">
                  Confira a pontuação do time abaixo. Para ver seu extrato individual, busque seu nome na lista.
                </p>
              </div>
              <p className="flex items-center gap-2 text-sm text-white/80">
                <Coins className="size-4 text-brand" aria-hidden />
                Total de Floww Coins <strong className="text-white">0</strong>
              </p>
            </div>

            <label className="relative mt-5 block">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/60" aria-hidden />
              <input
                type="search"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Busque pelo nome"
                aria-label="Busque pelo nome"
                className="h-11 w-full rounded-lg border border-panel-active bg-background pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-brand"
              />
            </label>

            <div role="tablist" className="mt-3 flex gap-1 border-b border-panel-active">
              {FILTROS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  aria-selected={filtro === item.value}
                  onClick={() => setFiltro(item.value)}
                  className={cn(
                    "-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold transition",
                    filtro === item.value ? "border-brand text-brand" : "border-transparent text-white/80 hover:text-white",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {RANKING.length === 0 ? <p className="py-12 text-center text-sm text-white/80">Nenhuma pessoa encontrada.</p> : null}
          </section>
        </section>
      </main>
    </div>
  );
}
