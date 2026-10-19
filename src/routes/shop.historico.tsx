import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Coins, Package } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shop/historico")({
  head: () => ({
    meta: [{ title: "Histórico — Orcoma Orkomakers" }],
  }),
  component: HistoricoPage,
});

// Sem dados por enquanto: as transações chegam da fonte real depois.
const TRANSACOES: never[] = [];

function ResumoCard({
  icone: Icone,
  rotulo,
  valor,
  destaque,
}: {
  icone: React.ComponentType<{ className?: string }>;
  rotulo: string;
  valor: number;
  destaque: string;
}) {
  return (
    <div className="rounded-xl border border-panel-active bg-background p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-white/80">{rotulo}</p>
          <p className="mt-1 font-display text-2xl font-bold text-white">{valor}</p>
        </div>
        <div className="rounded-xl bg-brand/10 p-3">
          <Icone className={cn("size-5", destaque)} aria-hidden />
        </div>
      </div>
    </div>
  );
}

function HistoricoPage() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <section className="rounded-2xl border border-panel-active bg-panel p-6 sm:p-8">
          <header>
            <h1 className="font-display text-3xl font-semibold text-white">Histórico de Transações</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              Acompanhe todas as suas entradas e saídas de Floww Coins, incluindo compras na loja e recompensas.
            </p>
          </header>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <ResumoCard icone={ArrowUpRight} rotulo="Total Recebido" valor={0} destaque="text-brand" />
            <ResumoCard icone={ArrowDownRight} rotulo="Total Gasto" valor={0} destaque="text-brand" />
            <ResumoCard icone={Coins} rotulo="Saldo Disponível" valor={0} destaque="text-brand" />
          </div>

          <div className="mt-6 flex h-64 items-center justify-center rounded-xl border border-panel-active bg-background">
            <p className="text-sm text-white/80">Nenhuma transação para exibir</p>
          </div>

          <section className="mt-8" aria-labelledby="historico-title">
            <h2 id="historico-title" className="font-display text-xl font-semibold text-white">
              Extrato completo
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Lista de todas as movimentações ordenadas da mais recente para a mais antiga.
            </p>
            <div className="mt-4 space-y-3" role="list" aria-label="Histórico de transações">
              {TRANSACOES.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-panel-active bg-background py-12 text-center">
                  <Package className="size-12 text-brand" aria-hidden />
                  <p className="font-semibold text-white">Nenhuma transação registrada</p>
                  <p className="text-sm text-white/80">Suas compras e recompensas aparecerão aqui.</p>
                </div>
              ) : null}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
