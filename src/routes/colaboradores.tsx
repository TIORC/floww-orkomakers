import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Mail, UserRound } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CARTOES_POR_PAGINA,
  listarDiretorio,
  listarOpcoesDiretorio,
  type ColaboradorDiretorio,
  type FiltrosDiretorio,
} from "@/lib/colaboradores-diretorio";
import { getIniciais } from "@/lib/iniciais";

export const Route = createFileRoute("/colaboradores")({
  head: () => ({
    meta: [{ title: "Colaboradores — Orcoma Orkomakers" }],
  }),
  component: ColaboradoresPage,
});

const TODOS = "";

const CAMPO =
  "h-10 w-full rounded-lg border border-panel-active bg-background px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-brand";

function CampoFiltro({
  id,
  rotulo,
  valor,
  opcoes,
  onChange,
}: {
  id: string;
  rotulo: string;
  valor: string;
  opcoes: string[];
  onChange: (valor: string) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-white">
        {rotulo}
      </label>
      <select id={id} value={valor} onChange={(evento) => onChange(evento.target.value)} className={CAMPO}>
        <option value={TODOS}>Todos</option>
        {opcoes.map((opcao) => (
          <option key={opcao} value={opcao}>
            {opcao}
          </option>
        ))}
      </select>
    </div>
  );
}

// Texto do cabeçalho: evita repetir "Departamento" quando a planilha já traz o prefixo.
function textoDepartamento(departamento: string) {
  if (!departamento) return "Departamento não informado";
  return /^departamento/i.test(departamento) ? departamento : `Departamento ${departamento}`;
}

function CardColaborador({ colaborador }: { colaborador: ColaboradorDiretorio }) {
  const [emailAberto, setEmailAberto] = useState(false);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-panel-active bg-background shadow-lg">
      <header className="bg-brand px-3 py-1.5 text-center text-xs font-semibold text-slate-900">
        {textoDepartamento(colaborador.departamento)}
      </header>

      <div className="flex flex-col items-center gap-2 px-4 pt-5">
        <Avatar className="size-20">
          <AvatarImage src={colaborador.fotoUrl || undefined} alt={`Foto de ${colaborador.nome}`} />
          <AvatarFallback className="bg-panel-active text-panel-text">
            {colaborador.nome ? getIniciais(colaborador.nome) : <UserRound className="size-8" aria-hidden />}
          </AvatarFallback>
        </Avatar>
        <h3 className="text-center font-display text-base font-semibold text-white">{colaborador.nome}</h3>
        {/* Cargo visível: o cargo que a própria pessoa informou, não o cadastrado. */}
        <span className="w-full truncate rounded-full border border-panel-active px-3 py-1 text-center text-xs italic text-panel-label">
          {colaborador.cargoVisivel || "Cargo não informado"}
        </span>
      </div>

      <div className="mt-auto flex justify-end gap-2 border-t border-panel-active px-4 py-2.5">
        {colaborador.email && (
          <button
            type="button"
            onClick={() => setEmailAberto((atual) => !atual)}
            aria-label={`Ver e-mail de ${colaborador.nome}`}
            aria-expanded={emailAberto}
            className="rounded-full p-1.5 text-panel-label transition hover:bg-panel-active hover:text-white"
          >
            <Mail className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {emailAberto && colaborador.email && (
        <p className="break-all border-t border-panel-active bg-panel px-4 py-2 text-xs text-white">{colaborador.email}</p>
      )}
    </article>
  );
}

function ColaboradoresPage() {
  const [unidade, setUnidade] = useState(TODOS);
  const [departamento, setDepartamento] = useState(TODOS);
  const [papel, setPapel] = useState(TODOS);
  const [pesquisa, setPesquisa] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [pagina, setPagina] = useState(0);

  // Espera a pessoa parar de digitar antes de consultar o banco.
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaAplicada(pesquisa.trim());
      setPagina(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [pesquisa]);

  const filtros: FiltrosDiretorio = { busca: buscaAplicada, unidade, departamento, papel };

  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: ["colaboradores-diretorio", pagina, filtros],
    queryFn: () => listarDiretorio(pagina, filtros),
    placeholderData: keepPreviousData,
  });
  const colaboradores = data?.itens ?? [];
  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / CARTOES_POR_PAGINA));

  const { data: opcoes } = useQuery({
    queryKey: ["colaboradores-diretorio", "opcoes"],
    queryFn: listarOpcoesDiretorio,
    staleTime: 5 * 60 * 1000,
  });

  function alterar(setter: (valor: string) => void) {
    return (valor: string) => {
      setter(valor);
      setPagina(0);
    };
  }

  function limparFiltros() {
    setUnidade(TODOS);
    setDepartamento(TODOS);
    setPapel(TODOS);
    setPesquisa("");
    setPagina(0);
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 space-y-6 px-10 pb-10 pt-24">
        <PerfilFlutuante />
        <section className="rounded-2xl border border-panel-active bg-panel p-6">
          <h1 className="font-display text-3xl font-semibold text-white">Colaboradores</h1>
          <p className="mt-1 text-sm text-white/80">
            Aqui você pode encontrar a listagem de todos os colaboradores da sua empresa cadastrados, junto com suas
            informações.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CampoFiltro
              id="filtro-unidade"
              rotulo="Unidade"
              valor={unidade}
              opcoes={opcoes?.unidades ?? []}
              onChange={alterar(setUnidade)}
            />
            <CampoFiltro
              id="filtro-departamento"
              rotulo="Departamento"
              valor={departamento}
              opcoes={opcoes?.departamentos ?? []}
              onChange={alterar(setDepartamento)}
            />
            <CampoFiltro
              id="filtro-papel"
              rotulo="Papéis"
              valor={papel}
              opcoes={opcoes?.papeis ?? []}
              onChange={alterar(setPapel)}
            />
            <div className="grid gap-1.5">
              <label htmlFor="filtro-pesquisa" className="text-sm font-semibold text-white">
                Pesquisar
              </label>
              <input
                id="filtro-pesquisa"
                type="search"
                placeholder="Palavra-chave: nome, cargo ou departamento"
                value={pesquisa}
                onChange={(evento) => setPesquisa(evento.target.value)}
                className={CAMPO}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={limparFiltros}
              className="rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand/10"
            >
              Limpar filtros
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-panel-active bg-panel p-6">
          {isPending ? (
            <p className="py-12 text-center text-sm text-white/80">Carregando colaboradores...</p>
          ) : isError ? (
            <p className="py-12 text-center text-sm text-white/80">Não foi possível carregar os colaboradores.</p>
          ) : colaboradores.length === 0 ? (
            <p className="py-12 text-center text-sm text-white/80">Nenhum colaborador encontrado.</p>
          ) : (
            <>
              <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {colaboradores.map((colaborador) => (
                  <li key={colaborador.id}>
                    <CardColaborador colaborador={colaborador} />
                  </li>
                ))}
              </ul>

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
            </>
          )}
        </section>
      </main>
    </div>
  );
}
