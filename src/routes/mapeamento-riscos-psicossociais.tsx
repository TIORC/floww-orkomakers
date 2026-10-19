import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BarChart3, Sparkles } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mapeamento-riscos-psicossociais")({
  head: () => ({
    meta: [{ title: "Mapeamento Psicossocial — Orcoma Orkomakers" }],
  }),
  component: MapeamentoRiscosPsicossociaisPage,
});

const PERIODOS = ["Todo o período", "Últimos 30 dias", "Últimos 90 dias", "Este ano"] as const;

const CAMPO =
  "h-10 w-full rounded-lg border border-panel-active bg-background px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-brand";

// Sem dados por enquanto: as avaliações, setores e resultados agregados chegam da fonte real depois.
// A análise da Floww! IA também depende dos resultados agregados e fica desativada até lá.

function Cartao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-panel-active bg-panel p-6">
      <h2 className="font-display text-base font-semibold text-white">{titulo}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MapeamentoRiscosPsicossociaisPage() {
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]>("Todo o período");
  const [setor, setSetor] = useState("todos");

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <div className="mb-8">
          <p className="text-sm text-white/80">Relatórios e Pesquisas</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-white">Mapeamento Psicossocial</h1>
        </div>

        <div className="mb-6 flex flex-wrap justify-end gap-3">
          <select aria-label="Setor" value={setor} onChange={(evento) => setSetor(evento.target.value)} className={cn(CAMPO, "w-56")}>
            <option value="todos">Todos os setores</option>
          </select>
          <select
            aria-label="Período"
            value={periodo}
            onChange={(evento) => setPeriodo(evento.target.value as (typeof PERIODOS)[number])}
            className={cn(CAMPO, "w-56")}
          >
            {PERIODOS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Cartao titulo="Índice de Atenção Psicossocial">
            <p className="text-sm text-white/80">Nenhum resultado agregado disponível para este período.</p>
          </Cartao>

          <Cartao titulo="Relatos por fator">
            <div className="flex min-h-[16rem] flex-col items-center justify-center gap-2 text-center">
              <BarChart3 className="size-12 text-brand" aria-hidden />
              <p className="text-sm text-white/80">Os relatos por fator aparecerão aqui quando houver dados.</p>
            </div>
          </Cartao>
        </div>

        <div className="mt-6">
          <Cartao titulo="Análise da Floww! IA">
            <div className="flex items-center gap-3">
              <Sparkles className="size-5 text-brand" aria-hidden />
              <p className="text-sm text-white/80">
                A análise é feita somente sobre os resultados agregados desta seleção. A análise trata de fatores
                organizacionais e condições de trabalho; não realiza diagnósticos clínicos.
              </p>
            </div>
            <button
              type="button"
              disabled
              className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-900 opacity-50"
            >
              Gerar análise
            </button>
          </Cartao>
        </div>

      </main>
    </div>
  );
}
