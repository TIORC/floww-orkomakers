import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Coins, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";

import { ConheçaLojaDialog } from "@/components/onboarding/conheca-loja-dialog";
import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { catalogoJaVisitado, marcarCatalogoVisitado } from "@/lib/onboarding-catalogo";

export const Route = createFileRoute("/catalogo")({
  head: () => ({
    meta: [{ title: "Catálogo — Orcoma Orkomakers" }],
  }),
  component: CatalogoPage,
});

// Sem dados por enquanto: o catálogo e o saldo chegam da fonte real depois.
const PRODUTOS: never[] = [];
const SALDO = 0;

function CatalogoPage() {
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [carrinho] = useState<never[]>([]);
  const [conhecaLojaAberto, setConhecaLojaAberto] = useState(false);

  useEffect(() => {
    if (!catalogoJaVisitado()) setConhecaLojaAberto(true);
  }, []);

  function fecharConhecaLoja() {
    marcarCatalogoVisitado();
    setConhecaLojaAberto(false);
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <section className="rounded-2xl border border-panel-active bg-panel p-6 sm:p-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-semibold text-white">Catálogo</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                Confira o que está disponível na loja e troque suas Floww Coins antes que acabe!
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-panel-active px-3 py-1.5">
                <Coins className="size-4 text-brand" aria-hidden />
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/80">Seu saldo</span>
                <span className="font-display text-sm font-bold text-white">{SALDO}</span>
              </div>
              <button
                type="button"
                aria-label="Abrir carrinho"
                aria-expanded={carrinhoAberto}
                onClick={() => setCarrinhoAberto((aberto) => !aberto)}
                className="relative inline-flex size-10 items-center justify-center rounded-lg border border-brand text-brand transition hover:bg-brand/10"
              >
                <ShoppingCart className="size-4" aria-hidden />
                {carrinho.length > 0 ? (
                  <span className="absolute -right-1.5 -top-1.5 inline-flex size-5 items-center justify-center rounded-full bg-brand text-[0.65rem] font-bold text-slate-900">
                    {carrinho.length}
                  </span>
                ) : null}
              </button>
            </div>
          </header>

          {carrinhoAberto ? (
            <aside className="mt-6 rounded-xl border border-panel-active bg-background p-4">
              <h2 className="font-display text-lg font-semibold text-white">Carrinho de compras</h2>
              <div className="mt-4 flex items-center justify-between gap-3 text-sm text-white/80">
                <p>Seu carrinho está vazio.</p>
                <Trash2 className="size-4 text-white/40" aria-hidden />
              </div>
            </aside>
          ) : null}


          {PRODUTOS.length === 0 ? (
            <div className="mt-10 flex flex-col items-center gap-3 py-12 text-center">
              <ShoppingBag className="size-14 text-brand" aria-hidden />
              <p className="font-semibold text-white">Nenhum produto disponível no momento</p>
              <p className="text-sm text-white/80">Os itens da loja aparecerão aqui assim que forem cadastrados.</p>
            </div>
          ) : null}
        </section>
      </main>
      <ConheçaLojaDialog aberto={conhecaLojaAberto} onFechar={fecharConhecaLoja} />
    </div>
  );
}
