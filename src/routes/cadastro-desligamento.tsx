import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImportarColaboradoresDialog } from "@/components/painel/importar-colaboradores-dialog";
import {
  DetalhesColaboradorDialog,
  type IdentificadorColaborador,
} from "@/components/painel/detalhes-colaborador-dialog";
import { useUsuarioLogado, podeGerenciarColaboradores } from "@/hooks/use-usuario-logado";
import {
  COLABORADORES_POR_PAGINA,
  listarColaboradoresImportados,
  listarOpcoesFiltro,
  salvarImportacao,
  type FiltrosColaboradores,
  type LinhaImportada,
} from "@/lib/importacao-colaboradores";
import { FileSpreadsheet, Plus, Search, UsersRound } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { CadastrarColaboradorDialog } from "@/components/painel/cadastrar-colaborador-dialog";
import { DesligadosDialog } from "@/components/painel/desligados-dialog";
import { PerfilFlutuante } from "@/components/perfil-flutuante";

export const Route = createFileRoute("/cadastro-desligamento")({
  head: () => ({
    meta: [{ title: "Cadastro e Desligamento — Orcoma Orkomakers" }],
  }),
  component: CadastroDesligamentoPage,
});

const COLUNAS = ["Nome", "Cargo", "Setor", "Gestor Direto", "Unidade", "Situação"];
const CHAVE_COLABORADORES = ["colaboradores-importados"];
const CAMPO_FILTRO =
  "h-11 rounded-lg border border-panel-active bg-background px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-brand";

// Bolinha com a foto; sem foto, mostra as iniciais do nome.
function Avatar({ nome, fotoUrl }: { nome: string; fotoUrl: string }) {
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
  return (
    <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-panel-active text-xs font-bold text-panel-text">
      {fotoUrl ? <img src={fotoUrl} alt="" className="size-full object-cover" /> : iniciais || "—"}
    </span>
  );
}

function CadastroDesligamentoPage() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [pagina, setPagina] = useState(0);
  const [setor, setSetor] = useState("");
  const [gestor, setGestor] = useState("");
  const [unidade, setUnidade] = useState("");
  const [cadastrarAberto, setCadastrarAberto] = useState(false);
  const [importarAberto, setImportarAberto] = useState(false);
  const [desligadosAberto, setDesligadosAberto] = useState(false);
  const [desativadosAberto, setDesativadosAberto] = useState(false);
  const [detalhe, setDetalhe] = useState<IdentificadorColaborador | null>(null);
  const { data: usuario } = useUsuarioLogado();
  const podeGerenciar = podeGerenciarColaboradores(usuario);

  // Espera a pessoa parar de digitar antes de consultar o banco.
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaAplicada(busca.trim());
      setPagina(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [busca]);

  const filtros: FiltrosColaboradores = { busca: buscaAplicada, setor, gestor, unidade, status: "ativos" };

  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: [...CHAVE_COLABORADORES, pagina, filtros],
    queryFn: () => listarColaboradoresImportados(pagina, filtros),
    placeholderData: keepPreviousData,
  });

  // Opções dos filtros mudam pouco; por isso ficam em cache por alguns minutos.
  const { data: opcoes } = useQuery({
    queryKey: [...CHAVE_COLABORADORES, "opcoes-filtro"],
    queryFn: listarOpcoesFiltro,
    staleTime: 5 * 60 * 1000,
  });
  const colaboradores = data?.itens ?? [];
  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / COLABORADORES_POR_PAGINA));

  // Grava a planilha no banco, recarrega a lista e informa o resultado.
  async function importarPlanilha(linhas: LinhaImportada[]) {
    try {
      const relatorio = await salvarImportacao(linhas);
      await queryClient.invalidateQueries({ queryKey: CHAVE_COLABORADORES });
      const resumo = `${relatorio.salvos} salvo(s), ${relatorio.duplicados.length} duplicado(s) ignorado(s), ${relatorio.falhas.length} com erro.`;
      if (relatorio.falhas.length > 0) {
        toast.warning(resumo);
      } else {
        toast.success(resumo);
      }
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível salvar a importação.");
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <section className="rounded-2xl border border-panel-active bg-panel p-6 sm:p-8">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold text-white">Cadastro e Desligamento</h1>
              <p className="mt-2 text-sm text-white/80">
                Consulte os colaboradores com setor, gestor direto e unidade.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setImportarAberto(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand/10"
              >
                <FileSpreadsheet className="size-4" aria-hidden />
                Importar Colaboradores (Planilha)
              </button>
              <button
                type="button"
                onClick={() => setCadastrarAberto(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110"
              >
                <Plus className="size-4" aria-hidden />
                Cadastrar colaborador
              </button>
            </div>
          </header>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <label className="relative block w-full max-w-xl">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/60" aria-hidden />
              <input
                type="search"
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Buscar colaborador por nome"
                aria-label="Buscar colaborador"
                className="h-11 w-full rounded-lg border border-panel-active bg-background pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-brand"
              />
            </label>
            <select
              aria-label="Filtrar por setor"
              value={setor}
              onChange={(evento) => {
                setSetor(evento.target.value);
                setPagina(0);
              }}
              className={CAMPO_FILTRO}
            >
              <option value="">Todos os setores</option>
              {opcoes?.setores.map((valor) => (
                <option key={valor} value={valor}>
                  {valor}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrar por gestor"
              value={gestor}
              onChange={(evento) => {
                setGestor(evento.target.value);
                setPagina(0);
              }}
              className={CAMPO_FILTRO}
            >
              <option value="">Todos os gestores</option>
              {opcoes?.gestores.map((valor) => (
                <option key={valor} value={valor}>
                  {valor}
                </option>
              ))}
            </select>
            <select
              aria-label="Filtrar por unidade"
              value={unidade}
              onChange={(evento) => {
                setUnidade(evento.target.value);
                setPagina(0);
              }}
              className={CAMPO_FILTRO}
            >
              <option value="">Todas as unidades</option>
              {opcoes?.unidades.map((valor) => (
                <option key={valor} value={valor}>
                  {valor}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setDesligadosAberto(true)}
              className="h-11 rounded-lg bg-red-900 px-4 text-sm font-semibold text-white shadow transition hover:bg-red-800"
            >
              Desligados
            </button>
            <button
              type="button"
              onClick={() => setDesativadosAberto(true)}
              className="h-11 rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white shadow transition hover:bg-orange-500"
            >
              Desativados
            </button>
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-panel-active">
            <table className="w-full min-w-[800px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-panel-active text-left text-xs font-semibold text-white/80">
                  {COLUNAS.map((coluna) => (
                    <th key={coluna} className="px-4 py-3">
                      {coluna}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isPending ? (
                  <tr>
                    <td colSpan={COLUNAS.length} className="py-12 text-center text-white/80">
                      Carregando colaboradores...
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={COLUNAS.length} className="py-12 text-center text-white/80">
                      Não foi possível carregar os colaboradores.
                    </td>
                  </tr>
                ) : colaboradores.length === 0 ? (
                  <tr>
                    <td colSpan={COLUNAS.length} className="py-12 text-center text-white/80">
                      <UsersRound className="mx-auto mb-3 size-10 text-brand" aria-hidden />
                      Nenhum colaborador cadastrado.
                    </td>
                  </tr>
                ) : (
                  colaboradores.map((colaborador) => (
                    <tr key={colaborador.id} className="border-b border-panel-active/60 text-white">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar nome={colaborador.nome} fotoUrl={colaborador.fotoUrl} />
                          <button
                            type="button"
                            onClick={() => setDetalhe({ id: colaborador.id })}
                            className="text-left hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                          >
                            {colaborador.nome || "—"}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">{colaborador.cargo || "—"}</td>
                      <td className="px-4 py-3">{colaborador.setor || "—"}</td>
                      <td className="px-4 py-3">
                        {colaborador.gestorDireto ? (
                          <div className="flex items-center gap-3">
                            <Avatar nome={colaborador.gestorDireto} fotoUrl={colaborador.gestorDiretoFotoUrl} />
                            <button
                              type="button"
                              disabled={!colaborador.gestorDiretoEmail}
                              onClick={() => setDetalhe({ email: colaborador.gestorDiretoEmail })}
                              className="text-left hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:no-underline disabled:hover:text-inherit"
                            >
                              {colaborador.gestorDireto}
                            </button>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">{colaborador.unidade || "—"}</td>
                      <td className="px-4 py-3">
                        {colaborador.desativado ? (
                          <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-semibold text-orange-400">
                            Desativado
                          </span>
                        ) : colaborador.inativo ? (
                          <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-400">
                            Inativo
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                            Ativo
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/80">
            <span>
              {total} colaborador(es) · página {pagina + 1} de {totalPaginas}
              {isFetching && !isPending ? " · atualizando..." : ""}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPagina((atual) => Math.max(0, atual - 1))}
                disabled={pagina === 0 || isPending}
                className="rounded-lg border border-panel-active px-4 py-2 font-semibold text-white transition hover:bg-panel-active disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPagina((atual) => atual + 1)}
                disabled={pagina + 1 >= totalPaginas || isPending}
                className="rounded-lg border border-panel-active px-4 py-2 font-semibold text-white transition hover:bg-panel-active disabled:cursor-not-allowed disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        </section>
      </main>
      <ImportarColaboradoresDialog
        aberto={importarAberto}
        onFechar={() => setImportarAberto(false)}
        onImportar={importarPlanilha}
      />
      <CadastrarColaboradorDialog aberto={cadastrarAberto} onFechar={() => setCadastrarAberto(false)} />
      <DesligadosDialog
        aberto={desligadosAberto}
        status="desligados"
        onFechar={() => setDesligadosAberto(false)}
        onDetalhe={setDetalhe}
      />
      <DesligadosDialog
        aberto={desativadosAberto}
        status="desativados"
        onFechar={() => setDesativadosAberto(false)}
        onDetalhe={setDetalhe}
      />
      <DetalhesColaboradorDialog
        identificador={detalhe}
        podeGerenciar={podeGerenciar}
        onFechar={() => setDetalhe(null)}
      />
    </div>
  );
}
