import { ChevronRight, Coins } from "lucide-react";

// Sem produtos por enquanto: a vitrine fica vazia até a importação do catálogo.
const PRODUTOS: never[] = [];

export function FlowwShop() {
  const saldo = 0;

  return (
    <section aria-label="Floww Shop" className="w-full">
      <h2 className="font-display text-xl font-semibold text-muted-foreground lg:text-right">
        Floww Shop - Vitrine da organização
      </h2>

      <div className="relative mt-4 flex h-full flex-col rounded-2xl bg-panel p-6">
        <div className="flex justify-end">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-panel-active px-3 py-1.5">
            <Coins className="size-3.5 shrink-0 text-brand" aria-hidden />
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-panel-text">Seu saldo</span>
            <span className="font-display text-sm font-bold text-foreground">{saldo}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-1 items-center justify-center">
          {PRODUTOS.length === 0 ? (
            <p className="py-8 text-center text-sm text-panel-text">Nenhum produto disponível.</p>
          ) : null}
        </div>

        <div className="mt-5 flex justify-center border-t border-panel-active pt-5">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110"
          >
            Ver catálogo
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
