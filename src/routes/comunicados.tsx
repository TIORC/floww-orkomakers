import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Megaphone, Sparkles } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/comunicados")({
  head: () => ({
    meta: [{ title: "Comunicados — Orcoma Orkomakers" }],
  }),
  component: ComunicadosPage,
});

const ABAS = [
  { id: "destaque", rotulo: "Em Destaque" },
  { id: "geral", rotulo: "Geral" },
] as const;
type Aba = (typeof ABAS)[number]["id"];

// Sem dados por enquanto: os comunicados chegam da fonte real depois.
const COMUNICADOS: never[] = [];

function EmptyComunicados({ destaque }: { destaque: boolean }) {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="relative mb-6 grid size-36 place-items-center rounded-[2rem] bg-brand/10 text-brand sm:size-44">
        <Megaphone className="size-20 sm:size-24" strokeWidth={1.2} aria-hidden />
        <span className="absolute -right-1 top-2 grid size-9 place-items-center rounded-full bg-brand text-slate-900 shadow-sm">
          <Sparkles className="size-4" aria-hidden />
        </span>
      </div>
      <h2 className="font-display text-lg font-semibold text-white">
        {destaque ? "Nenhum comunicado em destaque" : "Ainda não há comunicados"}
      </h2>
      <p className="mt-2 max-w-md text-sm text-white/80">
        {destaque
          ? "Quando houver uma informação importante em destaque, ela aparecerá aqui."
          : "Este espaço reúne novidades e informações compartilhadas pela sua empresa."}
      </p>
    </div>
  );
}

function ComunicadosPage() {
  const [aba, setAba] = useState<Aba>("destaque");

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <section className="min-h-[34rem] rounded-2xl border border-panel-active bg-panel p-6 sm:p-8">
          <header className="mb-8">
            <h1 className="font-display text-3xl font-semibold text-white">Comunicados</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              Melhore a comunicação na sua empresa com novidades e informações compartilhadas em um só lugar.
            </p>
          </header>

          <div role="tablist" className="flex gap-2 border-b border-panel-active">
            {ABAS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={aba === item.id}
                onClick={() => setAba(item.id)}
                className={cn(
                  "-mb-px rounded-t-md border border-b-0 px-4 py-3 text-sm font-semibold transition",
                  aba === item.id ? "border-brand bg-brand/10 text-brand" : "border-transparent text-white/80 hover:text-white",
                )}
              >
                {item.rotulo}
              </button>
            ))}
          </div>

          {COMUNICADOS.length === 0 ? <EmptyComunicados destaque={aba === "destaque"} /> : null}
        </section>
      </main>
    </div>
  );
}
