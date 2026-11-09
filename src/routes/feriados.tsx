import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { IconeFeriado } from "@/components/feriados/icone-feriado";
import { PainelSidebar } from "@/components/painel/painel-sidebar";
import {
  podeGerenciarFeriados,
  podeVerProgramacaoFerias,
  useUsuarioLogado,
} from "@/hooks/use-usuario-logado";
import { CHAVE_FERIADOS_CADASTRADOS, useFeriadosCadastrados } from "@/hooks/use-feriados";
import { dataBr, hojeIso } from "@/lib/calendario";
import {
  diasAte,
  feriadosDetalhados,
  proximaOcorrencia,
  proximosFeriados,
  ROTULO_TIPO_FERIADO,
  TIPOS_FERIADO,
  type FeriadoCadastrado,
  type TipoFeriado,
} from "@/lib/feriados";
import {
  removerFeriadoCadastrado,
  salvarFeriadoCadastrado,
  type DadosFeriado,
} from "@/lib/feriados-cadastro";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/feriados")({
  head: () => ({
    meta: [{ title: "Feriados — Orcoma Orkomakers" }],
  }),
  component: FeriadosPage,
});

const CAMPO =
  "h-10 w-full rounded-lg border border-panel-active bg-background px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-brand";

const FORMULARIO_VAZIO: DadosFeriado = {
  nome: "",
  data: "",
  recorrente: true,
  tipo: "municipal",
  abrangencia: "",
};

// Data como aparece na lista: recorrente mostra só o dia e o mês.
function dataExibida(feriado: FeriadoCadastrado) {
  return feriado.recorrente
    ? `Todo dia ${feriado.data.slice(8, 10)}/${feriado.data.slice(5, 7)}`
    : dataBr(feriado.data);
}

function FeriadosPage() {
  const { data: usuario, isPending: carregandoUsuario } = useUsuarioLogado();
  const queryClient = useQueryClient();
  const { feriados, isPending: carregandoFeriados } = useFeriadosCadastrados();
  const acesso = podeVerProgramacaoFerias(usuario);
  const podeGerenciar = podeGerenciarFeriados(usuario);
  const hoje = hojeIso();
  const [ano, setAno] = useState(() => Number(hoje.slice(0, 4)));
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<DadosFeriado>(FORMULARIO_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [remocaoPendente, setRemocaoPendente] = useState<FeriadoCadastrado | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<TipoFeriado | "todos">("todos");

  // Lista do ano (calculados e cadastrados), filtrada pelo tipo escolhido no seletor.
  const doAno = useMemo(
    () =>
      feriadosDetalhados(ano, feriados).filter((item) => tipoFiltro === "todos" || item.tipo === tipoFiltro),
    [ano, feriados, tipoFiltro],
  );
  // O próximo feriado do tipo escolhido: é o que aparece em destaque.
  const proximo = useMemo(
    () => proximosFeriados(hoje, feriados, 1, tipoFiltro === "todos" ? undefined : tipoFiltro)[0],
    [hoje, feriados, tipoFiltro],
  );

  const cadastradosOrdenados = useMemo(
    () =>
      [...feriados].sort(
        (a, b) =>
          TIPOS_FERIADO.indexOf(a.tipo) - TIPOS_FERIADO.indexOf(b.tipo) || a.nome.localeCompare(b.nome, "pt-BR"),
      ),
    [feriados],
  );

  function limparFormulario() {
    setEditandoId(null);
    setFormulario(FORMULARIO_VAZIO);
  }

  function editar(feriado: FeriadoCadastrado) {
    setEditandoId(feriado.id ?? null);
    setFormulario({
      nome: feriado.nome,
      data: feriado.data,
      recorrente: feriado.recorrente,
      tipo: feriado.tipo,
      abrangencia: feriado.abrangencia,
    });
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!podeGerenciar || !usuario) return;
    if (!formulario.nome.trim() || !formulario.data) {
      toast.error("Informe o nome e a data do feriado.");
      return;
    }
    setSalvando(true);
    try {
      await salvarFeriadoCadastrado({
        ...formulario,
        nome: formulario.nome.trim(),
        abrangencia: formulario.abrangencia.trim(),
        ...(editandoId ? { id: editandoId } : {}),
        quemEmail: usuario.email,
      });
      await queryClient.invalidateQueries({ queryKey: CHAVE_FERIADOS_CADASTRADOS });
      toast.success(editandoId ? "Feriado alterado." : "Feriado cadastrado.");
      limparFormulario();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível salvar o feriado.");
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarRemocao() {
    const feriado = remocaoPendente;
    setRemocaoPendente(null);
    if (!feriado?.id) return;
    try {
      await removerFeriadoCadastrado(feriado.id);
      await queryClient.invalidateQueries({ queryKey: CHAVE_FERIADOS_CADASTRADOS });
      if (editandoId === feriado.id) limparFormulario();
      toast.success("Feriado removido.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível remover o feriado.");
    }
  }

  if (!carregandoUsuario && !acesso) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <PainelSidebar />
        <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
          <h1 className="font-display text-3xl font-semibold text-white">Feriados</h1>
          <p className="mt-4 text-sm text-white/80">Você não tem acesso a esta página.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <header>
          <h1 className="font-display text-3xl font-semibold text-white">Feriados</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80">
            Os feriados cadastrados aqui aparecem no calendário de férias e bloqueiam o início das férias
            nos dois dias que antecedem cada um deles.
            {!podeGerenciar && " Só o RH pode cadastrar ou alterar feriados."}
          </p>
        </header>

        {podeGerenciar && (
          <section aria-label="Cadastro de feriado" className="mt-8 rounded-2xl border border-panel-active bg-panel p-6">
            <h2 className="font-display text-xl font-semibold text-white">
              {editandoId ? "Alterar feriado" : "Cadastrar feriado"}
            </h2>
            <form onSubmit={salvar} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="grid gap-1.5">
                <label htmlFor="feriado-nome" className="text-sm font-semibold text-white">
                  Nome
                </label>
                <input
                  id="feriado-nome"
                  className={CAMPO}
                  value={formulario.nome}
                  onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })}
                  placeholder="Ex.: Aniversário da cidade"
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="feriado-data" className="text-sm font-semibold text-white">
                  Data
                </label>
                <input
                  id="feriado-data"
                  type="date"
                  className={CAMPO}
                  value={formulario.data}
                  onChange={(e) => setFormulario({ ...formulario, data: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="feriado-tipo" className="text-sm font-semibold text-white">
                  Tipo
                </label>
                <select
                  id="feriado-tipo"
                  className={CAMPO}
                  value={formulario.tipo}
                  onChange={(e) => setFormulario({ ...formulario, tipo: e.target.value as TipoFeriado })}
                >
                  {TIPOS_FERIADO.map((tipo) => (
                    <option key={tipo} value={tipo} className="bg-panel">
                      {ROTULO_TIPO_FERIADO[tipo]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <label htmlFor="feriado-abrangencia" className="text-sm font-semibold text-white">
                  Abrangência
                </label>
                <input
                  id="feriado-abrangencia"
                  className={CAMPO}
                  value={formulario.abrangencia}
                  onChange={(e) => setFormulario({ ...formulario, abrangencia: e.target.value })}
                  placeholder="Ex.: BA, Salvador ou Empresa"
                />
              </div>
              <label className="flex items-center gap-3 self-end pb-2 text-sm text-white">
                <input
                  type="checkbox"
                  className="size-4 accent-brand"
                  checked={formulario.recorrente}
                  onChange={(e) => setFormulario({ ...formulario, recorrente: e.target.checked })}
                />
                Repete todo ano nesta data
              </label>
              <div className="flex items-end justify-end gap-3 md:col-span-2 xl:col-span-3">
                {editandoId && (
                  <button
                    type="button"
                    onClick={limparFormulario}
                    className="rounded-lg border border-panel-active px-4 py-2 text-sm font-semibold text-white transition hover:bg-panel-active"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={salvando}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110 disabled:opacity-50"
                >
                  {editandoId ? "Salvar alteração" : "Cadastrar"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section aria-label="Feriados cadastrados" className="mt-8">
          <h2 className="font-display text-xl font-semibold text-white">Cadastrados</h2>
          {carregandoFeriados ? (
            <p className="mt-3 text-sm text-white/70">Carregando…</p>
          ) : cadastradosOrdenados.length === 0 ? (
            <p className="mt-3 text-sm text-white/70">Nenhum feriado cadastrado ainda.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-panel-active">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <thead className="bg-panel text-white/70">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Nome</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Tipo</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Data</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Abrangência</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Próxima ocorrência</th>
                    {podeGerenciar && <th scope="col" className="px-4 py-3 font-semibold">Ações</th>}
                  </tr>
                </thead>
                <tbody>
                  {cadastradosOrdenados.map((feriado) => {
                    const proxima = proximaOcorrencia(feriado, hoje);
                    return (
                      <tr
                        key={feriado.id}
                        className={cn("border-t border-panel-active text-white", editandoId === feriado.id && "bg-panel-active/40")}
                      >
                        <td className="px-4 py-3 font-semibold">{feriado.nome}</td>
                        <td className="px-4 py-3">{ROTULO_TIPO_FERIADO[feriado.tipo]}</td>
                        <td className="px-4 py-3">{dataExibida(feriado)}</td>
                        <td className="px-4 py-3 text-white/80">{feriado.abrangencia || "—"}</td>
                        <td className="px-4 py-3 text-white/80">{proxima ? dataBr(proxima) : "Não ocorre mais"}</td>
                        {podeGerenciar && (
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => editar(feriado)}
                                className="rounded-lg border border-panel-active px-3 py-1.5 text-xs font-semibold text-white transition hover:border-brand hover:text-brand"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => setRemocaoPendente(feriado)}
                                className="rounded-lg border border-panel-active px-3 py-1.5 text-xs font-semibold text-white transition hover:border-red-400 hover:text-red-400"
                              >
                                Remover
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section aria-label="Próximo feriado" className="mt-8">
          <div className="flex flex-wrap items-end gap-4">
            <div className="grid gap-1.5">
              <label htmlFor="filtro-tipo-feriado" className="text-sm font-semibold text-white">
                Tipo de feriado
              </label>
              <select
                id="filtro-tipo-feriado"
                className={cn(CAMPO, "min-w-[14rem]")}
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value as TipoFeriado | "todos")}
              >
                <option value="todos" className="bg-panel">Todos os tipos</option>
                {TIPOS_FERIADO.map((tipo) => (
                  <option key={tipo} value={tipo} className="bg-panel">
                    {ROTULO_TIPO_FERIADO[tipo]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {proximo ? (
            <div className="mt-5 flex flex-wrap items-center gap-5 rounded-2xl border border-brand bg-panel p-5 shadow-lg shadow-brand/10">
              <IconeFeriado nome={proximo.nome} className="size-14" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand">
                  Próximo feriado{tipoFiltro === "todos" ? "" : ` ${ROTULO_TIPO_FERIADO[tipoFiltro].toLowerCase()}`}
                </p>
                <p className="font-display text-2xl font-semibold text-white">{proximo.nome}</p>
                <p className="text-sm text-white/80">
                  {dataBr(proximo.iso)} ·{" "}
                  <strong className="text-white">
                    {diasAte(hoje, proximo.iso) === 0
                      ? "é hoje"
                      : diasAte(hoje, proximo.iso) === 1
                        ? "é amanhã"
                        : `em ${diasAte(hoje, proximo.iso)} dias`}
                  </strong>
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-sm text-white/70">Nenhum feriado futuro deste tipo.</p>
          )}
        </section>

        <section aria-label="Feriados do ano" className="mt-10">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-xl font-semibold text-white">Feriados de {ano}</h2>
            <button
              type="button"
              onClick={() => setAno(ano - 1)}
              className="rounded-lg border border-panel-active px-3 py-1.5 text-sm text-white transition hover:border-brand hover:text-brand"
            >
              Ano anterior
            </button>
            <button
              type="button"
              onClick={() => setAno(ano + 1)}
              className="rounded-lg border border-panel-active px-3 py-1.5 text-sm text-white transition hover:border-brand hover:text-brand"
            >
              Próximo ano
            </button>
          </div>
          <p className="mt-2 text-sm text-white/70">
            Inclui os feriados nacionais e o 2 de Julho calculados pelo sistema, e os cadastrados acima.
          </p>
          <ul className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {doAno.map((item, indice) => (
              <li
                key={item.iso}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border border-panel-active bg-panel px-4 py-3",
                  proximo?.iso === item.iso && "ring-2 ring-brand",
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <IconeFeriado nome={item.nome} indice={indice} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{item.nome}</p>
                    <p className="text-xs text-white/70">{dataBr(item.iso)}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                    item.cadastrado ? "bg-brand/20 text-brand" : "bg-panel-active text-white/80",
                  )}
                >
                  {item.cadastrado ? "Cadastrado" : "Automático"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      {remocaoPendente && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remocao-feriado-titulo"
            aria-describedby="remocao-feriado-texto"
            className="w-full max-w-md rounded-2xl border border-brand bg-panel p-6 shadow-2xl shadow-brand/10"
          >
            <h3 id="remocao-feriado-titulo" className="font-display text-lg font-semibold text-brand">
              Remover feriado?
            </h3>
            <p id="remocao-feriado-texto" className="mt-3 text-sm text-white/85">
              O feriado {remocaoPendente.nome} será removido e deixa de aparecer no calendário e nas regras de
              férias. Essa ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setRemocaoPendente(null)}
                className="rounded-lg border border-panel-active px-4 py-2 text-sm font-semibold text-white transition hover:bg-panel-active"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarRemocao}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
