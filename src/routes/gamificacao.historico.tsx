import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { listarHistoricoRanking, NOMES_MESES, type MesRanking, type VencedorMes } from "@/lib/ranking-historico";

export const Route = createFileRoute("/gamificacao/historico")({
  head: () => ({
    meta: [{ title: "Histórico de Ranking — Orcoma Orkomakers" }],
  }),
  component: HistoricoGamificacaoPage,
});

function Avatar({ nome, fotoUrl }: { nome: string; fotoUrl: string }) {
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
  return (
    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-panel-active text-sm font-bold text-panel-text">
      {fotoUrl ? <img src={fotoUrl} alt="" className="size-full object-cover" /> : iniciais || "—"}
    </span>
  );
}

function CardMes({ mes }: { mes: MesRanking }) {
  const titulo = `Ranking de ${NOMES_MESES[mes.mes - 1] ?? ""} ${mes.ano}`;
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-panel-active bg-panel">
      <header className="bg-brand px-5 py-4 text-center text-slate-900">
        <h2 className="font-display text-base font-bold">{titulo}</h2>
        <p className="text-xs font-semibold">Meta {mes.meta.toLocaleString("pt-BR")} Orcoins</p>
      </header>

      <ol className="divide-y divide-panel-active/60">
        {mes.vencedores.map((vencedor: VencedorMes) => (
          <li key={vencedor.posicao} className="flex items-center gap-4 px-5 py-4">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-slate-900">
              {vencedor.posicao}
            </span>
            <Avatar nome={vencedor.nome} fotoUrl={vencedor.fotoUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">{vencedor.nome}</p>
              <p className="truncate text-xs text-panel-label">{vencedor.setor || "—"}</p>
            </div>
            <span className="shrink-0 font-display text-sm font-bold text-brand">
              {vencedor.pontos.toLocaleString("pt-BR")}
            </span>
          </li>
        ))}
      </ol>
    </article>
  );
}

function HistoricoGamificacaoPage() {
  const { data: meses = [], isPending, isError } = useQuery({
    queryKey: ["ranking-historico"],
    queryFn: listarHistoricoRanking,
  });

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <PerfilFlutuante />
        <section className="rounded-2xl border border-panel-active bg-panel p-6 sm:p-8">
          <header className="flex items-start gap-3">
            <History className="mt-1 size-6 shrink-0 text-brand" aria-hidden />
            <div>
              <h1 className="font-display text-3xl font-semibold text-white">Histórico de Ranking</h1>
              <p className="mt-2 text-sm text-white/80">
                Confira os vencedores de cada ranking mensal de gamificação, finalizado no fim de cada mês.
              </p>
            </div>
          </header>

          {isPending ? (
            <p className="py-12 text-center text-sm text-white/80">Carregando histórico...</p>
          ) : isError ? (
            <p className="py-12 text-center text-sm text-white/80">Não foi possível carregar o histórico.</p>
          ) : meses.length === 0 ? (
            <p className="py-12 text-center text-sm text-white/80">Nenhum ranking mensal finalizado ainda.</p>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {meses.map((mes) => (
                <CardMes key={`${mes.ano}-${mes.mes}`} mes={mes} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
