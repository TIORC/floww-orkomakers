import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ClipboardCheck, Eye, Plus, Sparkles, Target, X } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planos-desenvolvimento")({
  head: () => ({
    meta: [{ title: "Planos de Desenvolvimento — Orcoma Orkomakers" }],
  }),
  component: PlanosDesenvolvimento,
});

const ABAS = ["Ativos", "Finalizados", "Expirados"] as const;
type Aba = (typeof ABAS)[number];

// Sem dados por enquanto: planos, equipe e objetivos chegam da fonte real depois.
const PLANOS: never[] = [];
const OBJETIVOS: never[] = [];

function PlanosDesenvolvimento() {
  const [aba, setAba] = useState<Aba>("Ativos");
  const [novidadeAberta, setNovidadeAberta] = useState(true);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 space-y-6 px-10 pb-10 pt-24">
        <section className="rounded-2xl border border-panel-active bg-panel p-6">
          <h1 className="font-display text-xl font-semibold text-white">Meu Desenvolvimento</h1>
        </section>

        <section className="rounded-2xl border border-panel-active bg-panel p-6">
          {novidadeAberta ? (
            <div className="flex items-center gap-3 rounded-xl border border-brand/40 bg-brand/10 px-4 py-3">
              <Sparkles className="size-4 shrink-0 text-brand" aria-hidden />
              <p className="min-w-0 flex-1 text-sm text-white">
                Novidade! Organize seus objetivos e acompanhe seu desenvolvimento.
              </p>
              <button type="button" className="text-sm font-semibold text-brand underline underline-offset-4">
                Criar meu PDI
              </button>
              <button
                type="button"
                aria-label="Fechar novidade"
                onClick={() => setNovidadeAberta(false)}
                className="rounded-md p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" className="flex gap-1 rounded-lg bg-background p-1">
              {ABAS.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={aba === item}
                  onClick={() => setAba(item)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-semibold transition",
                    aba === item ? "bg-brand text-slate-900" : "text-white hover:bg-panel-active",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110"
            >
              <Plus className="size-4" aria-hidden />
              Criar um plano
            </button>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="flex min-h-[26rem] flex-col items-center justify-center rounded-2xl bg-background p-8 text-center">
              {PLANOS.length === 0 ? (
                <>
                  <div className="flex size-40 items-center justify-center rounded-full bg-panel-active">
                    <ClipboardCheck className="size-16 text-brand" aria-hidden />
                  </div>
                  <p className="mt-6 font-semibold text-white">Nenhum plano ativo no momento</p>
                  <p className="mt-1 text-sm text-white">
                    Crie um plano para transformar seus objetivos em próximos passos.
                  </p>
                </>
              ) : null}
            </div>

            <aside className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-semibold text-white">Minha equipe</h2>
                <p className="text-xs text-white/70">Você</p>
                <div className="mt-2 flex items-center gap-3 rounded-xl border border-panel-active bg-background p-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand font-display text-sm font-bold text-slate-900">
                    TM
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">TI Maracas</p>
                    <p className="text-xs text-white/70">TI</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Ver detalhes"
                    className="rounded-md border border-panel-active p-1.5 text-white transition hover:bg-panel-active"
                  >
                    <Eye className="size-4" aria-hidden />
                  </button>
                </div>
                <p className="mt-4 text-xs text-white/70">Equipe · mesmo setor</p>
                <p className="mt-2 rounded-xl bg-background p-3 text-sm text-white">
                  Nenhum outro colaborador do seu setor encontrado.
                </p>
              </div>

              <div>
                <h2 className="font-display text-lg font-semibold text-white">Mapa de objetivos</h2>
                <p className="text-xs text-white/70">
                  Acompanhe os objetivos dos seus planos e os que já foram concluídos.
                </p>
                <button
                  type="button"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-brand bg-transparent px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-brand/10"
                >
                  <Target className="size-4" aria-hidden />
                  Ver todos os objetivos ({OBJETIVOS.length})
                </button>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
