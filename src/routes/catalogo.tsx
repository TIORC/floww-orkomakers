import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Coins, Minus, Plus, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";

import { ConheçaLojaDialog } from "@/components/onboarding/conheca-loja-dialog";
import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { catalogoJaVisitado, marcarCatalogoVisitado } from "@/lib/onboarding-catalogo";
import { imagemProduto, PRODUTOS } from "@/lib/produtos-loja";

export const Route = createFileRoute("/catalogo")({
  head: () => ({
    meta: [{ title: "Catálogo — Orcoma Orkomakers" }],
  }),
  component: CatalogoPage,
});

// Saldo fixo por enquanto: o saldo real chega da fonte depois.
const SALDO = 0;

function CatalogoPage() {
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  // Quantidade por id de produto.
  const [carrinho, setCarrinho] = useState<Record<string, number>>({});
  const [conhecaLojaAberto, setConhecaLojaAberto] = useState(false);

  useEffect(() => {
    if (!catalogoJaVisitado()) setConhecaLojaAberto(true);
  }, []);

  function fecharConhecaLoja() {
    marcarCatalogoVisitado();
    setConhecaLojaAberto(false);
  }

  const itensCarrinho = PRODUTOS.filter((produto) => (carrinho[produto.id] ?? 0) > 0);
  const quantidadeTotal = Object.values(carrinho).reduce((soma, qtd) => soma + qtd, 0);
  const total = itensCarrinho.reduce(
    (soma, produto) => soma + produto.preco * (carrinho[produto.id] ?? 0),
    0,
  );
  const saldoInsuficiente = total > SALDO;

  function adicionarAoCarrinho(id: string) {
    setCarrinho((atual) => ({ ...atual, [id]: (atual[id] ?? 0) + 1 }));
  }

  function alterarQuantidade(id: string, delta: number) {
    setCarrinho((atual) => {
      const proxima = { ...atual };
      const quantidade = (atual[id] ?? 0) + delta;
      if (quantidade <= 0) delete proxima[id];
      else proxima[id] = quantidade;
      return proxima;
    });
  }

  function removerDoCarrinho(id: string) {
    setCarrinho((atual) => {
      const proxima = { ...atual };
      delete proxima[id];
      return proxima;
    });
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-4 pb-10 pt-24 sm:px-6 lg:px-10">
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
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/80">
                  Seu saldo
                </span>
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
                {quantidadeTotal > 0 ? (
                  <span className="absolute -right-1.5 -top-1.5 inline-flex size-5 items-center justify-center rounded-full bg-brand text-[0.65rem] font-bold text-slate-900">
                    {quantidadeTotal}
                  </span>
                ) : null}
              </button>
            </div>
          </header>

          {carrinhoAberto ? (
            <aside className="mt-6 rounded-xl border border-panel-active bg-background p-4">
              <h2 className="font-display text-lg font-semibold text-white">Carrinho de compras</h2>

              {itensCarrinho.length === 0 ? (
                <div className="mt-4 flex items-center justify-between gap-3 text-sm text-white/80">
                  <p>Seu carrinho está vazio.</p>
                  <Trash2 className="size-4 text-white/40" aria-hidden />
                </div>
              ) : (
                <>
                  <ul className="mt-4 divide-y divide-panel-active">
                    {itensCarrinho.map((produto) => {
                      const quantidade = carrinho[produto.id];
                      return (
                        <li key={produto.id} className="flex items-center gap-3 py-3">
                          <img
                            src={imagemProduto(produto)}
                            alt=""
                            className="size-12 shrink-0 rounded-lg"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">
                              {produto.nome}
                            </p>
                            <p className="text-xs text-white/70">
                              {produto.preco} Floww Coins cada
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label={`Diminuir quantidade de ${produto.nome}`}
                              onClick={() => alterarQuantidade(produto.id, -1)}
                              className="inline-flex size-7 items-center justify-center rounded-md border border-panel-active text-white transition hover:bg-panel-active"
                            >
                              <Minus className="size-3.5" aria-hidden />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold text-white">
                              {quantidade}
                            </span>
                            <button
                              type="button"
                              aria-label={`Aumentar quantidade de ${produto.nome}`}
                              onClick={() => alterarQuantidade(produto.id, 1)}
                              className="inline-flex size-7 items-center justify-center rounded-md border border-panel-active text-white transition hover:bg-panel-active"
                            >
                              <Plus className="size-3.5" aria-hidden />
                            </button>
                            <button
                              type="button"
                              aria-label={`Remover ${produto.nome} do carrinho`}
                              onClick={() => removerDoCarrinho(produto.id)}
                              className="ml-1 inline-flex size-7 items-center justify-center rounded-md text-white/60 transition hover:text-white"
                            >
                              <Trash2 className="size-3.5" aria-hidden />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-4 flex flex-col gap-3 border-t border-panel-active pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-white/80">
                        Total: <span className="font-display font-bold text-white">{total}</span>{" "}
                        Floww Coins
                      </p>
                      {saldoInsuficiente ? (
                        <p className="text-xs text-red-400">
                          Saldo insuficiente para finalizar a compra.
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      disabled={saldoInsuficiente}
                      className="inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Finalizar compra
                    </button>
                  </div>
                </>
              )}
            </aside>
          ) : null}

          {PRODUTOS.length === 0 ? (
            <div className="mt-10 flex flex-col items-center gap-3 py-12 text-center">
              <ShoppingBag className="size-14 text-brand" aria-hidden />
              <p className="font-semibold text-white">Nenhum produto disponível no momento</p>
              <p className="text-sm text-white/80">
                Os itens da loja aparecerão aqui assim que forem cadastrados.
              </p>
            </div>
          ) : (
            <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {PRODUTOS.map((produto) => (
                <li
                  key={produto.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-panel-active bg-background transition hover:border-brand/60 hover:shadow-lg"
                >
                  <div className="flex h-44 items-center justify-center bg-panel-active">
                    <img
                      src={imagemProduto(produto)}
                      alt={produto.nome}
                      loading="lazy"
                      className="size-36 rounded-lg"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-panel-text">
                      {produto.categoria}
                    </span>
                    <h3 className="line-clamp-2 text-sm font-semibold text-white">
                      {produto.nome}
                    </h3>
                    <p className="line-clamp-2 text-xs text-white/70">{produto.descricao}</p>
                    <div className="mt-auto flex items-center gap-1.5 pt-2">
                      <Coins className="size-4 text-brand" aria-hidden />
                      <span className="font-display text-lg font-bold text-white">
                        {produto.preco}
                      </span>
                      <span className="text-xs text-white/70">Floww Coins</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => adicionarAoCarrinho(produto.id)}
                      className="mt-2 w-full rounded-full bg-brand px-4 py-2 text-sm font-semibold text-slate-900 transition hover:brightness-110"
                    >
                      Adicionar ao carrinho
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <ConheçaLojaDialog aberto={conhecaLojaAberto} onFechar={fecharConhecaLoja} />
    </div>
  );
}
