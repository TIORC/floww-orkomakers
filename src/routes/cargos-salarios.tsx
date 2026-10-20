import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import {
  excluirCargo,
  listarCargos,
  listarSetores,
  salvarCargo,
  type Cargo,
  type DadosSenioridade,
  type Senioridade,
} from "@/lib/cargos";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cargos-salarios")({
  head: () => ({
    meta: [{ title: "Cargos e Salários — Orcoma Orkomakers" }],
  }),
  component: CargosSalariosPage,
});

const ITENS_POR_PAGINA = 10;
const SETOR_TODOS = "";

const CAMPO =
  "h-10 w-full rounded-lg border border-panel-active bg-background px-3 text-sm text-white outline-none placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-brand";
const ROTULO = "grid gap-1.5 text-sm font-semibold text-white";

const moeda = (valor: number) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function iniciais(nome: string) {
  return nome
    .split(/\s+/)
    .filter((parte) => parte.length > 2)
    .slice(0, 3)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

// Posição do salário base dentro da faixa, em porcentagem (para a barrinha).
function posicaoNaFaixa(senioridade: Senioridade) {
  const amplitude = Math.max(1, senioridade.faixaMaxima - senioridade.faixaMinima);
  const posicao = ((senioridade.salarioBase - senioridade.faixaMinima) / amplitude) * 100;
  return Math.min(100, Math.max(0, posicao));
}

type FormularioSenioridade = {
  chave: string;
  nivel: string;
  faixaMinima: string;
  salarioBase: string;
  faixaMaxima: string;
};

type FormularioCargo = {
  nome: string;
  cbo: string;
  setor: string;
  senioridades: FormularioSenioridade[];
};

function novaSenioridade(): FormularioSenioridade {
  return { chave: crypto.randomUUID(), nivel: "", faixaMinima: "", salarioBase: "", faixaMaxima: "" };
}

function formularioVazio(): FormularioCargo {
  return { nome: "", cbo: "", setor: "", senioridades: [] };
}

function formularioDoCargo(cargo: Cargo): FormularioCargo {
  return {
    nome: cargo.nome,
    cbo: cargo.cbo,
    setor: cargo.setor,
    senioridades: cargo.senioridades.map((item) => ({
      chave: item.id,
      nivel: item.nivel,
      faixaMinima: String(item.faixaMinima),
      salarioBase: String(item.salarioBase),
      faixaMaxima: String(item.faixaMaxima),
    })),
  };
}

// Valida o formulário e devolve as senioridades prontas, ou a mensagem do primeiro problema.
function validarFormulario(formulario: FormularioCargo): DadosSenioridade[] | string {
  if (!formulario.nome.trim()) return "Informe o nome do cargo.";
  if (!formulario.setor) return "Selecione o setor do cargo.";
  const senioridades: DadosSenioridade[] = [];
  for (const item of formulario.senioridades) {
    const minima = Number(item.faixaMinima);
    const base = Number(item.salarioBase);
    const maxima = Number(item.faixaMaxima);
    if (!item.nivel.trim()) return "Informe o nível de cada senioridade.";
    if (!(minima > 0) || !(base > 0) || !(maxima > 0)) {
      return `Informe as três faixas salariais de "${item.nivel.trim()}".`;
    }
    if (!(minima <= base && base <= maxima)) {
      return `Em "${item.nivel.trim()}", o salário base precisa ficar entre a faixa mínima e a máxima.`;
    }
    senioridades.push({
      nivel: item.nivel.trim(),
      faixaMinima: minima,
      salarioBase: base,
      faixaMaxima: maxima,
    });
  }
  return senioridades;
}

function CargosSalariosPage() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [setorFiltro, setSetorFiltro] = useState(SETOR_TODOS);
  const [pagina, setPagina] = useState(1);
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [cargoEmEdicao, setCargoEmEdicao] = useState<Cargo | null>(null);
  const [formulario, setFormulario] = useState<FormularioCargo>(formularioVazio);
  const [salvando, setSalvando] = useState(false);

  // Espera a pessoa parar de digitar antes de filtrar.
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaAplicada(busca.trim().toLowerCase());
      setPagina(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [busca]);

  const { data: cargos = [], isPending, isError } = useQuery({
    queryKey: ["cargos"],
    queryFn: listarCargos,
    placeholderData: keepPreviousData,
  });

  const { data: setoresBanco = [] } = useQuery({
    queryKey: ["setores"],
    queryFn: listarSetores,
  });

  // Setores do catálogo, somados aos que já aparecem nos cargos (caso tenham sido apagados do catálogo).
  const setores = useMemo(() => {
    const nomes = new Set([...setoresBanco, ...cargos.map((cargo) => cargo.setor)]);
    return Array.from(nomes).filter(Boolean).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [setoresBanco, cargos]);

  // Um cargo por linha; as senioridades aparecem abaixo dele.
  const cargosFiltrados = useMemo(() => {
    return cargos.filter((cargo) => {
      if (setorFiltro && cargo.setor !== setorFiltro) return false;
      if (!buscaAplicada) return true;
      return (
        cargo.nome.toLowerCase().includes(buscaAplicada) ||
        cargo.cbo.toLowerCase().includes(buscaAplicada) ||
        cargo.setor.toLowerCase().includes(buscaAplicada) ||
        cargo.senioridades.some((item) => item.nivel.toLowerCase().includes(buscaAplicada))
      );
    });
  }, [cargos, buscaAplicada, setorFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(cargosFiltrados.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const cargosPagina = cargosFiltrados.slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA);

  function abrirCriacao() {
    setCargoEmEdicao(null);
    setFormulario(formularioVazio());
    setDialogoAberto(true);
  }

  function abrirEdicao(cargo: Cargo) {
    setCargoEmEdicao(cargo);
    setFormulario(formularioDoCargo(cargo));
    setDialogoAberto(true);
  }

  function fecharDialogo() {
    setDialogoAberto(false);
    setCargoEmEdicao(null);
  }

  function atualizarSenioridade(chave: string, campo: keyof FormularioSenioridade, valor: string) {
    setFormulario((atual) => ({
      ...atual,
      senioridades: atual.senioridades.map((item) => (item.chave === chave ? { ...item, [campo]: valor } : item)),
    }));
  }

  function removerSenioridade(chave: string) {
    setFormulario((atual) => ({
      ...atual,
      senioridades: atual.senioridades.filter((item) => item.chave !== chave),
    }));
  }

  async function salvar() {
    const resultado = validarFormulario(formulario);
    if (typeof resultado === "string") {
      toast.error(resultado);
      return;
    }
    setSalvando(true);
    try {
      await salvarCargo(
        cargoEmEdicao?.id ?? null,
        { nome: formulario.nome.trim(), cbo: formulario.cbo.trim(), setor: formulario.setor },
        resultado,
      );
      await queryClient.invalidateQueries({ queryKey: ["cargos"] });
      toast.success(cargoEmEdicao ? "Cargo atualizado." : "Cargo cadastrado.");
      fecharDialogo();
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : "Não foi possível salvar o cargo.";
      toast.error(mensagem.includes("duplicate") ? "Já existe um cargo com esse nome neste setor." : mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!cargoEmEdicao) return;
    if (!window.confirm(`Excluir o cargo "${cargoEmEdicao.nome}"?`)) return;
    setSalvando(true);
    try {
      await excluirCargo(cargoEmEdicao.id);
      await queryClient.invalidateQueries({ queryKey: ["cargos"] });
      toast.success("Cargo excluído.");
      fecharDialogo();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível excluir o cargo.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <PerfilFlutuante />
        <section className="rounded-2xl border border-panel-active bg-panel p-6 sm:p-8">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold text-white">Cargos e Salários</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/80">
                Defina a estrutura salarial, níveis de remuneração e cargos agrupados por setor.
              </p>
            </div>
            <button
              type="button"
              onClick={abrirCriacao}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110"
            >
              <Plus className="size-4" aria-hidden />
              Cadastrar cargo
            </button>
          </header>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <label className="relative block w-full max-w-xl flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/60" aria-hidden />
              <input
                type="search"
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Buscar por cargo, CBO, setor ou nível"
                aria-label="Buscar cargo"
                className="h-11 w-full rounded-lg border border-panel-active bg-background pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-brand"
              />
            </label>
            <select
              aria-label="Filtrar por setor"
              value={setorFiltro}
              onChange={(evento) => {
                setSetorFiltro(evento.target.value);
                setPagina(1);
              }}
              className="h-11 w-56 rounded-lg border border-panel-active bg-background px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <option value={SETOR_TODOS}>Todos os setores</option>
              {setores.map((setor) => (
                <option key={setor} value={setor}>
                  {setor}
                </option>
              ))}
            </select>
            <p className="ml-auto text-xs text-white/70">
              Exibindo {cargosFiltrados.length} {cargosFiltrados.length === 1 ? "cargo" : "cargos"}
            </p>
          </div>

          {isPending ? (
            <p className="py-12 text-center text-sm text-white/80">Carregando cargos...</p>
          ) : isError ? (
            <p className="py-12 text-center text-sm text-white/80">Não foi possível carregar os cargos.</p>
          ) : cargosFiltrados.length === 0 ? (
            <div className="mt-6 flex min-h-[16rem] flex-col items-center justify-center rounded-xl border border-dashed border-panel-active px-6 py-12 text-center">
              <h2 className="font-display text-lg font-semibold text-white">Nenhum cargo cadastrado</h2>
              <p className="mt-2 max-w-md text-sm text-white/80">
                Clique em "Cadastrar cargo" para criar o primeiro cargo e as senioridades com a faixa salarial.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-xl border border-panel-active">
              <table className="w-full min-w-[860px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-panel-active text-left text-xs font-semibold text-white/80">
                    <th className="px-4 py-3">Cargo</th>
                    <th className="px-4 py-3">Setor</th>
                    <th className="px-4 py-3">Níveis</th>
                    <th className="px-4 py-3">Faixa salarial (mín - máx)</th>
                    <th className="px-4 py-3">Salário base médio</th>
                    <th className="w-12 px-4 py-3">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cargosPagina.map((cargo) => {
                    const senioridades = cargo.senioridades;
                    const media =
                      senioridades.length > 0
                        ? senioridades.reduce((soma, item) => soma + item.salarioBase, 0) / senioridades.length
                        : 0;
                    const minimo = senioridades.length > 0 ? Math.min(...senioridades.map((item) => item.faixaMinima)) : 0;
                    const maximo = senioridades.length > 0 ? Math.max(...senioridades.map((item) => item.faixaMaxima)) : 0;
                    return (
                      <Fragment key={cargo.id}>
                        <tr className="border-b border-panel-active/60 text-white">
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-3">
                              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/15 text-xs font-semibold text-brand">
                                {iniciais(cargo.nome) || "?"}
                              </span>
                              <span className="min-w-0">
                                <span className="block font-medium">{cargo.nome}</span>
                                {cargo.cbo && <span className="block text-xs text-white/60">CBO: {cargo.cbo}</span>}
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
                              {cargo.setor}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {senioridades.length > 0 ? senioridades.map((item) => item.nivel).join(" · ") : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {senioridades.length > 0 ? `${moeda(minimo)} - ${moeda(maximo)}` : "—"}
                          </td>
                          <td className="px-4 py-3 font-semibold">{senioridades.length > 0 ? moeda(media) : "—"}</td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              aria-label={`Editar ${cargo.nome}`}
                              onClick={() => abrirEdicao(cargo)}
                              className="rounded-md p-1.5 text-white/80 transition hover:bg-panel-active hover:text-white"
                            >
                              <Pencil className="size-4" aria-hidden />
                            </button>
                          </td>
                        </tr>
                        {senioridades.map((item) => (
                          <tr key={item.id} className="border-b border-panel-active/40 bg-background/60 text-white">
                            <td className="py-3 pl-12 pr-4">
                              <span className="flex items-center gap-2">
                                <span className="text-white/50" aria-hidden>
                                  └
                                </span>
                                {item.nivel}
                              </span>
                            </td>
                            <td className="px-4 py-3" />
                            <td className="px-4 py-3" />
                            <td className="px-4 py-3">
                              <div className="grid gap-1.5">
                                <span>
                                  {moeda(item.faixaMinima)} - {moeda(item.faixaMaxima)}
                                </span>
                                <span className="h-1.5 w-full overflow-hidden rounded-full bg-panel-active">
                                  <span
                                    className="block h-full rounded-full bg-emerald-500"
                                    style={{ width: `${posicaoNaFaixa(item)}%` }}
                                  />
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-semibold">{moeda(item.salarioBase)}</td>
                            <td className="px-4 py-3" />
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {cargosFiltrados.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/80">
              <span>
                Página {paginaAtual} de {totalPaginas}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPagina(Math.max(1, paginaAtual - 1))}
                  disabled={paginaAtual === 1}
                  className="rounded-lg border border-panel-active px-4 py-2 font-semibold text-white transition hover:bg-panel-active disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setPagina(Math.min(totalPaginas, paginaAtual + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className="rounded-lg border border-panel-active px-4 py-2 font-semibold text-white transition hover:bg-panel-active disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {dialogoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cargo-dialogo-titulo"
            className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-panel-active bg-panel p-6 shadow-2xl sm:p-8"
          >
            <button
              type="button"
              aria-label="Fechar"
              onClick={fecharDialogo}
              className="absolute right-4 top-4 rounded-md p-1.5 text-white/80 transition hover:bg-panel-active hover:text-white"
            >
              <X className="size-5" aria-hidden />
            </button>

            <h2 id="cargo-dialogo-titulo" className="font-display text-xl font-semibold text-white">
              {cargoEmEdicao ? "Editar cargo" : "Cadastrar cargo"}
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Defina o cargo e, em seguida, cadastre cada senioridade com a sua faixa salarial. Campos com{" "}
              <span className="text-destructive">*</span> são obrigatórios.
            </p>

            <div className="mt-6 grid gap-4">
              <label className={ROTULO}>
                Nome do cargo <span className="text-destructive">*</span>
                <input
                  value={formulario.nome}
                  onChange={(evento) => setFormulario({ ...formulario, nome: evento.target.value })}
                  placeholder="Ex.: Desenvolvedor de Software"
                  className={CAMPO}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className={ROTULO}>
                  CBO (não obrigatório)
                  <input
                    value={formulario.cbo}
                    onChange={(evento) => setFormulario({ ...formulario, cbo: evento.target.value })}
                    placeholder="Ex.: 2124-05"
                    className={CAMPO}
                  />
                </label>
                <label className={ROTULO}>
                  Setor <span className="text-destructive">*</span>
                  <select
                    value={formulario.setor}
                    onChange={(evento) => setFormulario({ ...formulario, setor: evento.target.value })}
                    className={CAMPO}
                  >
                    <option value="">Selecione um setor</option>
                    {setores.map((setor) => (
                      <option key={setor} value={setor}>
                        {setor}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Senioridades</p>
                  <p className="text-xs text-white/70">Ex.: Júnior, Pleno, Sênior. Cada senioridade vira uma linha na tabela.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormulario({ ...formulario, senioridades: [...formulario.senioridades, novaSenioridade()] })}
                  className="inline-flex items-center gap-2 rounded-lg border border-brand px-3 py-2 text-sm font-semibold text-brand transition hover:bg-brand/10"
                >
                  <Plus className="size-4" aria-hidden />
                  Adicionar senioridade
                </button>
              </div>

              {formulario.senioridades.length === 0 ? (
                <p className="rounded-xl border border-dashed border-panel-active px-4 py-6 text-center text-sm text-white/70">
                  Nenhuma senioridade adicionada. Você pode salvar o cargo sem elas e incluir depois.
                </p>
              ) : (
                <div className="grid gap-3">
                  {formulario.senioridades.map((item) => (
                    <div key={item.chave} className="grid gap-3 rounded-xl border border-panel-active bg-background p-3 md:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
                      <label className={ROTULO}>
                        Nível
                        <input
                          value={item.nivel}
                          onChange={(evento) => atualizarSenioridade(item.chave, "nivel", evento.target.value)}
                          placeholder="Ex.: Pleno"
                          className={CAMPO}
                        />
                      </label>
                      <label className={ROTULO}>
                        Faixa mínima
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.faixaMinima}
                          onChange={(evento) => atualizarSenioridade(item.chave, "faixaMinima", evento.target.value)}
                          className={CAMPO}
                        />
                      </label>
                      <label className={ROTULO}>
                        Salário base
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.salarioBase}
                          onChange={(evento) => atualizarSenioridade(item.chave, "salarioBase", evento.target.value)}
                          className={CAMPO}
                        />
                      </label>
                      <label className={ROTULO}>
                        Faixa máxima
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.faixaMaxima}
                          onChange={(evento) => atualizarSenioridade(item.chave, "faixaMaxima", evento.target.value)}
                          className={CAMPO}
                        />
                      </label>
                      <button
                        type="button"
                        aria-label="Remover senioridade"
                        onClick={() => removerSenioridade(item.chave)}
                        className="mt-6 h-10 self-start rounded-lg border border-panel-active px-3 text-sm font-semibold text-white transition hover:bg-panel-active"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-panel-active pt-5">
              <div>
                {cargoEmEdicao && (
                  <button
                    type="button"
                    onClick={excluir}
                    disabled={salvando}
                    className="rounded-lg border border-destructive px-4 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
                  >
                    Excluir cargo
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={fecharDialogo}
                  className="rounded-lg border border-panel-active px-4 py-2 text-sm font-semibold text-white transition hover:bg-panel-active"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={salvar}
                  disabled={salvando}
                  className={cn(
                    "rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110 disabled:opacity-60",
                  )}
                >
                  {salvando ? "Salvando..." : cargoEmEdicao ? "Salvar alterações" : "Cadastrar cargo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
