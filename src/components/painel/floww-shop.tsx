import { Link } from "@tanstack/react-router";
import { ChevronRight, Coins } from "lucide-react";

import { PRODUTOS } from "@/lib/produtos-loja";

export function FlowwShop() {
  const saldo = 0;
  const destaques = PRODUTOS.slice(0, 3);

  return (
    <section aria-label="Floww Shop" className="w-full">
      <h2 className="font-display text-xl font-semibold text-muted-foreground lg:text-right">
        Floww Shop - Vitrine da organização
      </h2>

      <div className="relative mt-4 flex h-full flex-col rounded-2xl bg-panel p-6">
        <div className="flex justify-end">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-panel-active px-3 py-1.5">
            <Coins className="size-3.5 shrink-0 text-brand" aria-hidden />
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-panel-text">
              Seu saldo
            </span>
            <span className="font-display text-sm font-bold text-foreground">{saldo}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-1 items-center justify-center">
          {destaques.length === 0 ? (
            <p className="py-8 text-center text-sm text-panel-text">Nenhum produto disponível.</p>
          ) : (
            <ul className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
              {destaques.map((produto) => (
                <li
                  key={produto.id}
                  className="flex items-center gap-3 rounded-xl bg-panel-active/60 p-3"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-panel">
                    <produto.icone className="size-5 text-brand" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{produto.nome}</p>
                    <p className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
                      <Coins className="size-3" aria-hidden />
                      {produto.preco}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-5 flex justify-center border-t border-panel-active pt-5">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110"
          >
            Ver catálogo
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
