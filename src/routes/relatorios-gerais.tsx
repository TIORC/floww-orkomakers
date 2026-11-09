import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, SmilePlus } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { resumoHumor, type EmocaoRelatorio, type PeriodoRelatorio } from "@/lib/checkin-sentimento";
import type { SelecaoPeriodo } from "@/components/ferias/calendario-anual";
import { CalendarioPeriodo } from "@/components/calendario-periodo";
import { dataBr, ordenarPeriodo } from "@/lib/calendario";
import { buscarRelatorioFerias, type LinhaRelatorioFerias } from "@/lib/ferias-relatorio";
import { cn } from "@/lib/utils";

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

// DEMONSTRAÇÃO: dados fictícios só para ver o visual. Troque por `false` (ou apague) para voltar aos dados reais.
const MOSTRAR_DADOS_DEMONSTRATIVOS = false;

const DADOS_DEMONSTRATIVOS_FERIAS: LinhaRelatorioFerias[] = [
  {
    nome: "Ana Beatriz Souza",
    setor: "Departamento Comercial",
    cargo: "Consultora Comercial",
    liderDireto: "Raimundo Cláudio",
    inicio: "04/01/2027",
    fim: "18/01/2027",
    aquisitivoInicio: "05/03/2026",
    aquisitivoFim: "04/03/2027",
  },
  {
    nome: "Bruno Henrique Lima",
    setor: "Departamento TI/Desenvolvimento",
    cargo: "Desenvolvedor Pleno",
    liderDireto: "Welder Silva",
    inicio: "11/01/2027",
    fim: "25/01/2027",
    aquisitivoInicio: "13/01/2026",
    aquisitivoFim: "12/01/2027",
  },
  {
    nome: "Camila Ferreira",
    setor: "Departamento Contábil",
    cargo: "Contábil",
    liderDireto: "Geane Lopes",
    inicio: "18/01/2027",
    fim: "31/01/2027",
    aquisitivoInicio: "02/02/2026",
    aquisitivoFim: "01/02/2027",
  },
  {
    nome: "Diego Martins",
    setor: "Departamento Técnico",
    cargo: "Gerente Técnico",
    liderDireto: "Jacson Mascarenhas",
    inicio: "25/01/2027",
    fim: "08/02/2027",
    aquisitivoInicio: "10/04/2026",
    aquisitivoFim: "09/04/2027",
  },
  {
    nome: "Eduarda Vitória",
    setor: "Departamento Contábil",
    cargo: "Auxiliar Contábil",
    liderDireto: "Geane Lopes",
    inicio: "01/02/2027",
    fim: "15/02/2027",
    aquisitivoInicio: "20/07/2026",
    aquisitivoFim: "19/07/2027",
  },
];

function RelatoriosGeraisPage() {
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]>("Todo o período");
  const { data: humor, isPending: carregandoHumor, isError: erroHumor } = useQuery({
    queryKey: ["relatorio-humor", periodo],
    queryFn: () => resumoHumor(periodo as PeriodoRelatorio),
  });
  // Período escolhido no calendário (vazio = todas as férias programadas).
  const [selecaoFerias, setSelecaoFerias] = useState<SelecaoPeriodo>({ inicio: null, fim: null });
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const periodoFerias =
    selecaoFerias.inicio && selecaoFerias.fim ? ordenarPeriodo(selecaoFerias.inicio, selecaoFerias.fim) : null;
  const relatorioFerias = useQuery({
    queryKey: ["relatorio-ferias", periodoFerias?.inicio ?? "", periodoFerias?.fim ?? ""],
    queryFn: () =>
      MOSTRAR_DADOS_DEMONSTRATIVOS
        ? Promise.resolve(DADOS_DEMONSTRATIVOS_FERIAS)
        : buscarRelatorioFerias({ inicio: periodoFerias?.inicio, fim: periodoFerias?.fim }),
  });

  // Quantidade de férias por setor no período, do setor que mais teve para o que menos teve.
  const feriasPorSetor = Object.entries(
    (relatorioFerias.data ?? []).reduce<Record<string, number>>((acumulado, linha) => {
      const setor = linha.setor || "Sem setor";
      acumulado[setor] = (acumulado[setor] ?? 0) + 1;
      return acumulado;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const maiorQuantidadeDeSetor = Math.max(1, ...feriasPorSetor.map(([, quantidade]) => quantidade));

  // Dispara a animação de subida das barras logo depois da primeira pintura.
  const [animacaoIniciada, setAnimacaoIniciada] = useState(false);
  useEffect(() => {
    const quadro = requestAnimationFrame(() => setAnimacaoIniciada(true));
    return () => cancelAnimationFrame(quadro);
  }, []);

  // Primeiro clique escolhe o início, o segundo escolhe o fim; um terceiro recomeça.
  function escolherDiaFerias(iso: string) {
    setSelecaoFerias((atual) =>
      atual.inicio && !atual.fim ? { inicio: atual.inicio, fim: iso } : { inicio: iso, fim: null },
    );
  }

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

        <section className="mt-6 rounded-2xl border border-panel-active bg-panel p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
                <CalendarDays className="size-5 text-brand" aria-hidden />
                Férias programadas e período aquisitivo
              </h2>
              <p className="mt-1 text-sm text-white/80">
                Quem tem férias programadas no intervalo, com setor, cargo, líder direto e o período aquisitivo a que
                as férias pertencem.
              </p>
            </div>
            <div className="relative flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setCalendarioAberto((aberto) => !aberto)}
                aria-expanded={calendarioAberto}
                className="h-10 rounded-lg border border-brand px-4 text-sm font-semibold text-brand transition hover:bg-brand/10"
              >
                {periodoFerias
                  ? `${dataBr(periodoFerias.inicio)} a ${dataBr(periodoFerias.fim)}`
                  : selecaoFerias.inicio
                    ? `Início ${dataBr(selecaoFerias.inicio)}: escolha o fim`
                    : "Escolher período"}
              </button>
              {(selecaoFerias.inicio || selecaoFerias.fim) && (
                <button
                  type="button"
                  onClick={() => setSelecaoFerias({ inicio: null, fim: null })}
                  className="h-10 rounded-lg px-3 text-sm text-white/80 transition hover:text-brand"
                >
                  Limpar
                </button>
              )}

              {calendarioAberto && (
                <div className="absolute right-0 top-full z-20 mt-2 w-[min(22rem,90vw)] rounded-xl border border-brand/60 bg-panel p-4 shadow-2xl">
                  <p className="mb-3 text-xs text-white/80">
                    Clique no primeiro e no último dia do período. Sem período, a lista mostra todas as férias.
                  </p>
                  <CalendarioPeriodo selecao={selecaoFerias} aoEscolherDia={escolherDiaFerias} />
                </div>
              )}
            </div>
          </div>

          {relatorioFerias.isPending ? (
            <p className="mt-6 text-sm text-white/80">Carregando...</p>
          ) : relatorioFerias.isError ? (
            <p className="mt-6 text-sm text-red-400">Não foi possível carregar o relatório de férias.</p>
          ) : (relatorioFerias.data ?? []).length === 0 ? (
            <p className="mt-6 text-sm text-white/80">Nenhuma férias programada neste período.</p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-panel-active text-xs font-semibold uppercase tracking-wide text-panel-label">
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">Setor</th>
                    <th className="px-3 py-2">Cargo</th>
                    <th className="px-3 py-2">Líder direto</th>
                    <th className="px-3 py-2">Férias</th>
                    <th className="px-3 py-2">Período aquisitivo</th>
                  </tr>
                </thead>
                <tbody>
                  {(relatorioFerias.data ?? []).map((linha, indice) => (
                    <tr key={`${linha.nome}-${linha.inicio}-${indice}`} className="border-b border-panel-active/60 text-white">
                      <td className="px-3 py-2 font-semibold">{linha.nome}</td>
                      <td className="px-3 py-2 text-white/85">{linha.setor || "—"}</td>
                      <td className="px-3 py-2 text-white/85">{linha.cargo || "—"}</td>
                      <td className="px-3 py-2 text-white/85">{linha.liderDireto || "—"}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {linha.inicio} a {linha.fim}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-white/85">
                        {linha.aquisitivoInicio ? `${linha.aquisitivoInicio} a ${linha.aquisitivoFim}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-panel-active bg-panel p-6">
          <h2 className="font-display text-lg font-semibold text-white">Férias por setor</h2>
          <p className="mt-1 text-sm text-white/80">
            Quais setores tiveram mais férias no período escolhido.
          </p>

          {feriasPorSetor.length === 0 ? (
            <p className="mt-6 text-sm text-white/80">Sem férias no período para mostrar.</p>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <div className="flex min-w-max items-end gap-6 px-2">
                {feriasPorSetor.map(([setor, quantidade], indice) => {
                  const altura = animacaoIniciada ? (quantidade / maiorQuantidadeDeSetor) * 100 : 0;
                  return (
                    <div key={setor} className="flex min-w-[6rem] flex-1 flex-col items-center">
                      <span
                        className={cn(
                          "mb-2 rounded-md bg-brand/15 px-2 py-0.5 text-sm font-bold text-brand transition-opacity duration-500",
                          animacaoIniciada ? "opacity-100" : "opacity-0",
                        )}
                        style={{ transitionDelay: `${indice * 90 + 500}ms` }}
                      >
                        {quantidade}
                      </span>
                      <div className="flex h-56 w-full items-end justify-center border-b border-panel-active">
                        <div
                          role="img"
                          aria-label={`${setor}: ${quantidade} férias`}
                          className="w-full max-w-[4.5rem] rounded-t-xl bg-gradient-to-t from-brand/50 via-brand to-amber-200 shadow-lg shadow-brand/30 transition-[height] duration-700 ease-out hover:brightness-110"
                          style={{ height: `${altura}%`, transitionDelay: `${indice * 90}ms` }}
                        />
                      </div>
                      <span className="mt-3 max-w-[8rem] text-center text-xs leading-tight text-white/85">
                        {setor}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
