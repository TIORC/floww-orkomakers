import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BriefcaseBusiness, Plus } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vagas")({
  head: () => ({
    meta: [{ title: "Vagas — Orcoma Orkomakers" }],
  }),
  component: VagasPage,
});

const ABAS = ["Abertas", "Fechadas"] as const;
type Aba = (typeof ABAS)[number];

// Sem dados por enquanto: as vagas chegam da fonte real depois.
const VAGAS: never[] = [];

function VagasVazias({ fechadas }: { fechadas: boolean }) {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-6 grid size-36 place-items-center rounded-[2rem] bg-brand/10 text-brand sm:size-44">
        <BriefcaseBusiness className="size-20 sm:size-24" strokeWidth={1.2} aria-hidden />
      </div>
      <h2 className="font-display text-lg font-semibold text-white">
        {fechadas ? "Nenhuma vaga fechada" : "Nenhuma vaga aberta"}
      </h2>
      <p className="mt-2 max-w-md text-sm text-white/80">
        {fechadas
          ? "As vagas encerradas aparecerão aqui."
          : "As oportunidades disponíveis para candidatura aparecerão aqui."}
      </p>
    </div>
  );
}

function VagasPage() {
  const [aba, setAba] = useState<Aba>("Abertas");

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <section className="min-h-[34rem] rounded-2xl border border-panel-active bg-panel p-6 sm:p-8">
          <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold text-white">Vagas</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                Consulte as oportunidades abertas e as vagas já encerradas.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110"
            >
              <Plus className="size-4" aria-hidden />
              Abrir vaga
            </button>
          </header>

          <div role="tablist" className="flex gap-2 border-b border-panel-active">
            {ABAS.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={aba === item}
                onClick={() => setAba(item)}
                className={cn(
                  "-mb-px rounded-t-md border border-b-0 px-4 py-3 text-sm font-semibold transition",
                  aba === item ? "border-brand bg-brand/10 text-brand" : "border-transparent text-white/80 hover:text-white",
                )}
              >
                {item}
              </button>
            ))}
          </div>

          {VAGAS.length === 0 ? <VagasVazias fechadas={aba === "Fechadas"} /> : null}
        </section>
      </main>
    </div>
  );
}
