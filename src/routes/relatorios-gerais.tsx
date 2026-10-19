import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SmilePlus } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { PerfilFlutuante } from "@/components/perfil-flutuante";

export const Route = createFileRoute("/relatorios-gerais")({
  head: () => ({
    meta: [{ title: "Relatórios Gerais — Orcoma Orkomakers" }],
  }),
  component: RelatoriosGeraisPage,
});

const PERIODOS = ["Todo o período", "Últimos 7 dias", "Últimos 30 dias", "Últimos 90 dias"] as const;

// Sem dados por enquanto: o termômetro do humor chega da fonte real depois.
const TOTAL_CHECKINS = 0;

const CAMPO =
  "h-10 w-56 rounded-lg border border-panel-active bg-background px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-brand";

function RelatoriosGeraisPage() {
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]>("Todo o período");

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <div className="mb-8">
          <p className="text-sm text-white/80">Relatórios e Pesquisas</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-white">Relatórios Gerais</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80">
            Indicadores consolidados da organização. Os dados são sempre agregados e não identificam colaboradores.
          </p>
        </div>

        <div className="mb-6 flex justify-end">
          <select
            value={periodo}
            onChange={(evento) => setPeriodo(evento.target.value as (typeof PERIODOS)[number])}
            aria-label="Período do relatório"
            className={CAMPO}
          >
            {PERIODOS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <section className="rounded-2xl border border-panel-active bg-panel p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
            <SmilePlus className="size-5 text-brand" aria-hidden />
            Termômetro do humor
          </h2>
          <p className="mt-1 text-sm text-white/80">
            Média do check-in diário de sentimento de todos os colaboradores no período.
          </p>

          {TOTAL_CHECKINS === 0 ? (
            <p className="mt-6 text-sm text-white/80">Ainda não há check-ins neste período.</p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
