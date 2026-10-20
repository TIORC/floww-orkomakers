import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SmilePlus } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { resumoHumor, type EmocaoRelatorio, type PeriodoRelatorio } from "@/lib/checkin-sentimento";

export const Route = createFileRoute("/relatorios-gerais")({
  head: () => ({
    meta: [{ title: "Relatórios Gerais — Orcoma Orkomakers" }],
  }),
  component: RelatoriosGeraisPage,
});

const PERIODOS = ["Todo o período", "Últimos 7 dias", "Últimos 30 dias", "Últimos 90 dias"] as const;

const EMOCOES_RELATORIO: { id: EmocaoRelatorio; rotulo: string; cor: string }[] = [
  { id: "muito_triste", rotulo: "Muito triste", cor: "bg-red-500" },
  { id: "triste", rotulo: "Triste", cor: "bg-orange-400" },
  { id: "neutro", rotulo: "Neutro", cor: "bg-slate-400" },
  { id: "feliz", rotulo: "Feliz", cor: "bg-lime-400" },
  { id: "muito_feliz", rotulo: "Muito feliz", cor: "bg-emerald-500" },
];

const CAMPO =
  "h-10 w-56 rounded-lg border border-panel-active bg-background px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-brand";

function RelatoriosGeraisPage() {
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]>("Todo o período");
  const { data: humor, isPending: carregandoHumor, isError: erroHumor } = useQuery({
    queryKey: ["relatorio-humor", periodo],
    queryFn: () => resumoHumor(periodo as PeriodoRelatorio),
  });

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

          {carregandoHumor ? (
            <p className="mt-6 text-sm text-white/80">Carregando...</p>
          ) : erroHumor || !humor ? (
            <p className="mt-6 text-sm text-white/80">Não foi possível carregar o termômetro.</p>
          ) : humor.total === 0 ? (
            <p className="mt-6 text-sm text-white/80">Ainda não há check-ins neste período.</p>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-[14rem_1fr]">
              <div className="rounded-xl border border-panel-active bg-background p-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-panel-label">Média do período</p>
                <p className="mt-2 font-display text-4xl font-bold text-white">{humor.media?.toFixed(1)}</p>
                <p className="mt-1 text-xs text-white/70">de 5 · {humor.total} check-in(s)</p>
              </div>
              <ul className="grid content-center gap-3">
                {EMOCOES_RELATORIO.map((emocao) => {
                  const quantidade = humor.contagem[emocao.id];
                  const percentual = humor.total > 0 ? Math.round((quantidade / humor.total) * 100) : 0;
                  return (
                    <li key={emocao.id} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3 text-sm text-white">
                      <span>{emocao.rotulo}</span>
                      <span className="h-2.5 overflow-hidden rounded-full bg-panel-active">
                        <span className={`block h-full rounded-full ${emocao.cor}`} style={{ width: `${percentual}%` }} />
                      </span>
                      <span className="text-right text-white/80">{percentual}%</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
