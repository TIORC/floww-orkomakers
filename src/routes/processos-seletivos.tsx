import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BriefcaseBusiness } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/processos-seletivos")({
  head: () => ({
    meta: [{ title: "Processos Seletivos — Orcoma Orkomakers" }],
  }),
  component: ProcessosSeletivosPage,
});

const ABAS = ["Ativos", "Fechados"] as const;
type Aba = (typeof ABAS)[number];

const ETAPAS = ["Novos", "Triagem", "Entrevista", "Proposta", "Contratado", "Reprovado"] as const;

const COLUNAS = ["Cargo", "Setor", "Gestor", "Nº de candidatos", "Data de abertura", "Status"];

// Sem dados por enquanto: os processos seletivos e candidatos chegam da fonte real depois.
// Os dados de exemplo do floww-hr não foram copiados, porque são nomes e contatos fictícios.
const PROCESSOS: never[] = [];

function ProcessosSeletivosPage() {
  const [aba, setAba] = useState<Aba>("Ativos");

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <section className="min-h-[34rem] rounded-2xl border border-panel-active bg-panel p-6 sm:p-8">
          <header className="mb-7">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-brand">
              <BriefcaseBusiness className="size-4" aria-hidden />
              Recrutamento
            </p>
            <h1 className="font-display text-3xl font-semibold text-white">Processos Seletivos</h1>
            <p className="mt-2 text-sm text-white/80">Acompanhe suas vagas e candidatos em cada etapa.</p>
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

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-panel-active text-left text-xs font-semibold text-white/80">
                  {COLUNAS.map((coluna) => (
                    <th key={coluna} className="px-3 py-3">
                      {coluna}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PROCESSOS.length === 0 ? (
                  <tr>
                    <td colSpan={COLUNAS.length} className="py-12 text-center text-white/80">
                      {aba === "Ativos" ? "Nenhum processo seletivo ativo." : "Nenhum processo seletivo fechado."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-8 border-t border-panel-active pt-6">
            <h2 className="font-display text-lg font-semibold text-white">Etapas do processo</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {ETAPAS.map((etapa) => (
                <span key={etapa} className="rounded-full border border-panel-active px-3 py-1 text-xs font-semibold text-white/80">
                  {etapa}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
