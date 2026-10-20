import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Coins, Search, UsersRound } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import {
  COLABORADORES_POR_PAGINA,
  listarColaboradoresImportados,
  listarRankingGestores,
  type EntradaRanking,
  type FiltrosColaboradores,
} from "@/lib/importacao-colaboradores";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/gamificacao")({
  head: () => ({
    meta: [{ title: "Gamificação — Orcoma Orkomakers" }],
  }),
  component: GamificacaoPage,
});

// Tabela de pontuação por ação (a mesma do floww-hr-portal).
const ACOES_GAMIFICACAO = [
  { descricao: "Acesso diário à plataforma", pontos: 100 },
  { descricao: "Alterar Avatar/Foto do perfil (pontuação única)", pontos: 10 },
  { descricao: "Responder Pesquisa de Engajamento", pontos: 200 },
  { descricao: "Responder Pesquisa de Satisfação", pontos: 500 },
  { descricao: "Responder Pesquisa Rápida", pontos: 500 },
  { descricao: "Responder Termômetro de Humor", pontos: 50 },
  { descricao: "Realizar check-in em um Objetivo", pontos: 100 },
  { descricao: "Celebrar", pontos: 10 },
  { descricao: "Enviar Feedback", pontos: 300 },
  { descricao: "Finalizar 1:1", pontos: 200 },
  { descricao: "Plano de Desenvolvimento (PDI) vigente", pontos: 500 },
  { descricao: "Responder uma Super Pesquisa", pontos: 500 },
];

// Saldo de Orcoins ainda não existe no banco: todos aparecem com 0.
const SALDO_PADRAO = 0;
const TOTAL_ORCOINS = 0;

type Aba = "todos" | "gestores";
const ABAS: { value: Aba; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "gestores", label: "Gestores" },
];

function Avatar({ nome, fotoUrl }: { nome: string; fotoUrl: string }) {
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
  return (
    <span className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-panel-active text-lg font-bold text-panel-text">
      {fotoUrl ? <img src={fotoUrl} alt="" className="size-full object-cover" /> : iniciais || "—"}
    </span>
  );
}

function CardPessoa({ entrada }: { entrada: EntradaRanking }) {
  return (
    <li className="flex flex-col items-center rounded-xl border border-panel-active bg-background p-5 text-center">
      <Avatar nome={entrada.nome} fotoUrl={entrada.fotoUrl} />
      <p className="mt-3 truncate font-display text-sm font-bold text-foreground">{entrada.nome}</p>
      <p className="mt-1 min-h-5 truncate text-xs text-panel-label">{entrada.subtitulo || "—"}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-bold text-slate-900">
        {SALDO_PADRAO.toLocaleString("pt-BR")} Orcoins
      </span>
    </li>
  );
}

function GamificacaoPage() {
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [pagina, setPagina] = useState(0);
  const [aba, setAba] = useState<Aba>("todos");

  // Espera a pessoa parar de digitar antes de consultar o banco.
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaAplicada(busca.trim());
      setPagina(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [busca]);

  const filtros: FiltrosColaboradores = { busca: buscaAplicada, setor: "", gestor: "", unidade: "" };

  const { data: paginaTodos, isPending, isError, isFetching } = useQuery({
    queryKey: ["gamificacao-ranking", "todos", pagina, buscaAplicada],
    queryFn: () => listarColaboradoresImportados(pagina, filtros),
    placeholderData: keepPreviousData,
    enabled: aba === "todos",
  });

  // Gestores: poucos valores distintos, então a lista vem completa e a busca é feita na tela.
  const { data: gestores = [], isPending: carregandoGestores, isError: erroGestores } = useQuery({
    queryKey: ["gamificacao-ranking", "gestores"],
    queryFn: listarRankingGestores,
    enabled: aba === "gestores",
  });

  const entradas: EntradaRanking[] =
    aba === "todos"
      ? (paginaTodos?.itens ?? []).map((item) => ({
          nome: item.nome,
          subtitulo: item.setor || item.cargo,
          fotoUrl: item.fotoUrl,
        }))
      : gestores.filter((gestor) => gestor.nome.toLowerCase().includes(buscaAplicada.toLowerCase()));

  const total = aba === "todos" ? (paginaTodos?.total ?? 0) : entradas.length;
  const totalPaginas = Math.max(1, Math.ceil(total / COLABORADORES_POR_PAGINA));
  const carregando = aba === "todos" ? isPending : carregandoGestores;
  const erro = aba === "todos" ? isError : erroGestores;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <PerfilFlutuante />
        <section className="rounded-2xl border border-panel-active bg-panel p-6 sm:p-8">
          <header>
            <h1 className="font-display text-3xl font-semibold text-white">Ranking de Gamificação</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              Veja quanto vale cada ação para ganhar Orcoins, acompanhe o ranking completo e confira o histórico dos
              pontos que você acumulou.
            </p>
          </header>

          <section className="mt-8" aria-labelledby="acoes-title">
            <h2 id="acoes-title" className="font-display text-lg font-semibold text-white">
              Ação e valor em pontos
            </h2>
            <ul className="mt-3 grid gap-x-10 gap-y-1 text-sm text-white/80 sm:grid-cols-2">
              {ACOES_GAMIFICACAO.map((acao) => (
                <li key={acao.descricao} className="flex justify-between gap-3 border-b border-panel-active py-1.5">
                  <span>{acao.descricao}</span>
                  <span className="shrink-0 font-semibold text-brand">{acao.pontos} Orcoins</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10" aria-labelledby="ranking-title">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="ranking-title" className="font-display text-xl font-semibold text-white">
                  Ranking completo
                </h2>
                <p className="mt-1 text-sm text-white/80">
                  Confira a pontuação do time abaixo. Para ver seu extrato individual, busque seu nome na lista.
                </p>
              </div>
              <div className="text-right text-sm text-white/80">
                <p>Total de Orcoins</p>
                <p className="font-display text-xl font-bold text-white">{TOTAL_ORCOINS.toLocaleString("pt-BR")}</p>
              </div>
            </div>

            <label className="relative mt-5 block">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/60" aria-hidden />
              <input
                type="search"
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Busque pelo nome"
                aria-label="Busque pelo nome"
                className="h-11 w-full rounded-lg border border-panel-active bg-background pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-brand"
              />
            </label>

            <div role="tablist" className="mt-3 flex gap-1 border-b border-panel-active">
              {ABAS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  aria-selected={aba === item.value}
                  onClick={() => {
                    setAba(item.value);
                    setPagina(0);
                  }}
                  className={cn(
                    "-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold transition",
                    aba === item.value ? "border-brand text-brand" : "border-transparent text-white/80 hover:text-white",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {carregando ? (
              <p className="py-12 text-center text-sm text-white/80">Carregando ranking...</p>
            ) : erro ? (
              <p className="py-12 text-center text-sm text-white/80">Não foi possível carregar o ranking.</p>
            ) : entradas.length === 0 ? (
              <div className="py-12 text-center text-sm text-white/80">
                <UsersRound className="mx-auto mb-3 size-10 text-brand" aria-hidden />
                Nenhuma pessoa encontrada.
              </div>
            ) : (
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {entradas.map((entrada) => (
                  <CardPessoa key={`${aba}-${entrada.nome}`} entrada={entrada} />
                ))}
              </ul>
            )}

            {aba === "todos" && !carregando && !erro ? (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-white/80">
                <span>
                  {total} colaborador(es) · página {pagina + 1} de {totalPaginas}
                  {isFetching && !isPending ? " · atualizando..." : ""}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPagina((atual) => Math.max(0, atual - 1))}
                    disabled={pagina === 0}
                    className="rounded-lg border border-panel-active px-4 py-2 font-semibold text-white transition hover:bg-panel-active disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setPagina((atual) => atual + 1)}
                    disabled={pagina + 1 >= totalPaginas}
                    className="rounded-lg border border-panel-active px-4 py-2 font-semibold text-white transition hover:bg-panel-active disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </section>
      </main>
    </div>
  );
}
