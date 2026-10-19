import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarCheck, ChevronDown, Plus, Search, SearchX } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";

export const Route = createFileRoute("/reunioes-1-1")({
  head: () => ({
    meta: [{ title: "Reuniões 1:1 — Orcoma Orkomakers" }],
  }),
  component: Reunioes11,
});

const STATUS = ["Agendadas", "Realizadas", "Canceladas", "Todas"] as const;
const CATEGORIAS = ["Todas", "Desenvolvimento", "Feedback", "Acompanhamento"] as const;
const FREQUENCIAS = ["Todas", "Semanal", "Quinzenal", "Mensal"] as const;

// Sem dados por enquanto: as reuniões chegam da fonte real depois.
const REUNIOES: never[] = [];

const CAMPO =
  "h-10 w-full rounded-lg border border-panel-active bg-background px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-brand";

function Reunioes11() {
  const [colaborador, setColaborador] = useState("");
  const [status, setStatus] = useState<(typeof STATUS)[number]>("Agendadas");
  const [categoria, setCategoria] = useState<(typeof CATEGORIAS)[number]>("Todas");
  const [frequencia, setFrequencia] = useState<(typeof FREQUENCIAS)[number]>("Todas");

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <section className="rounded-2xl border border-panel-active bg-panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Reuniões 1:1</h1>
              <p className="mt-1 text-sm text-white/80">
                Realize e gerencie conversas individuais com as pessoas da sua empresa.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-panel-active bg-background px-4 py-2 text-sm font-semibold text-white transition hover:bg-panel-active"
              >
                Integrar agenda
                <ChevronDown className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110"
              >
                <Plus className="size-4" aria-hidden />
                Criar reunião 1:1
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="grid gap-1.5 text-sm font-semibold text-white">
              Colaborador
              <span className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/60" aria-hidden />
                <input
                  type="search"
                  value={colaborador}
                  onChange={(event) => setColaborador(event.target.value)}
                  placeholder="Buscar colaborador com 1:1 existente"
                  className={`${CAMPO} pl-9 placeholder:text-white/50`}
                />
              </span>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-white">
              Status da reunião
              <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className={CAMPO}>
                {STATUS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-white">
              Categoria
              <select value={categoria} onChange={(event) => setCategoria(event.target.value as typeof categoria)} className={CAMPO}>
                {CATEGORIAS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-white">
              Frequência
              <select value={frequencia} onChange={(event) => setFrequencia(event.target.value as typeof frequencia)} className={CAMPO}>
                {FREQUENCIAS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="min-w-0">
              <div className="grid grid-cols-4 border-b border-panel-active px-4 pb-3 text-xs font-semibold text-white/80">
                <span>Nome do colaborador</span>
                <span>Última reunião</span>
                <span>Próxima reunião</span>
                <span>Frequência</span>
              </div>
              {REUNIOES.length === 0 ? (
                <div className="flex min-h-[18rem] flex-col items-center justify-center gap-2 text-center">
                  <SearchX className="size-12 text-brand" aria-hidden />
                  <p className="mt-2 font-semibold text-white">Nenhuma reunião encontrada</p>
                  <p className="text-sm text-white/80">
                    Crie uma conversa 1:1 ou ajuste os filtros para ver reuniões agendadas.
                  </p>
                </div>
              ) : null}
            </div>

            <aside className="rounded-2xl border border-panel-active bg-background p-5">
              <h2 className="font-display text-lg font-semibold text-white">Próximas conversas</h2>
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CalendarCheck className="size-14 text-brand" aria-hidden />
                <p className="font-semibold text-white">Sem reuniões agendadas</p>
                <p className="text-sm text-white/80">
                  Reserve um momento para conversar e acompanhar o desenvolvimento.
                </p>
                <button
                  type="button"
                  className="mt-2 rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand/10"
                >
                  Criar reunião
                </button>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
