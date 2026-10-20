import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import { excluirSetor, listarSetoresCompletos, salvarSetor, type Setor } from "@/lib/setores";

export const Route = createFileRoute("/setores")({
  head: () => ({
    meta: [{ title: "Setores — Orcoma Orkomakers" }],
  }),
  component: SetoresPage,
});

const CAMPO =
  "h-10 w-full rounded-lg border border-panel-active bg-background px-3 text-sm text-white outline-none placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-brand";

function SetoresPage() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [setorEmEdicao, setSetorEmEdicao] = useState<Setor | null>(null);
  const [nome, setNome] = useState("");
  const [sigla, setSigla] = useState("");
  const [salvando, setSalvando] = useState(false);

  const { data: setores = [], isPending, isError } = useQuery({
    queryKey: ["setores-completos"],
    queryFn: listarSetoresCompletos,
  });

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return setores;
    return setores.filter(
      (setor) => setor.nome.toLowerCase().includes(termo) || setor.sigla.toLowerCase().includes(termo),
    );
  }, [setores, busca]);

  function abrirCriacao() {
    setSetorEmEdicao(null);
    setNome("");
    setSigla("");
    setDialogoAberto(true);
  }

  function abrirEdicao(setor: Setor) {
    setSetorEmEdicao(setor);
    setNome(setor.nome);
    setSigla(setor.sigla);
    setDialogoAberto(true);
  }

  function fecharDialogo() {
    setDialogoAberto(false);
    setSetorEmEdicao(null);
  }

  async function atualizarLista() {
    await queryClient.invalidateQueries({ queryKey: ["setores-completos"] });
    await queryClient.invalidateQueries({ queryKey: ["setores"] });
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!nome.trim() || !sigla.trim()) {
      toast.error("Informe o nome e a sigla do setor.");
      return;
    }
    setSalvando(true);
    try {
      await salvarSetor(setorEmEdicao?.id ?? null, { nome, sigla }, setorEmEdicao?.nome);
      await atualizarLista();
      await queryClient.invalidateQueries({ queryKey: ["colaboradores-importados"] });
      await queryClient.invalidateQueries({ queryKey: ["cargos"] });
      toast.success(setorEmEdicao ? "Setor atualizado." : "Setor cadastrado.");
      fecharDialogo();
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : "Não foi possível salvar o setor.";
      toast.error(mensagem.includes("duplicate") ? "Já existe um setor com esse nome." : mensagem);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(setor: Setor) {
    if (!window.confirm(`Excluir o setor "${setor.nome}"?`)) return;
    try {
      await excluirSetor(setor.id);
      await atualizarLista();
      toast.success("Setor excluído.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível excluir o setor.");
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
              <h1 className="font-display text-3xl font-semibold text-white">Setores</h1>
              <p className="mt-2 text-sm text-white/80">Cadastre e organize os setores da empresa.</p>
            </div>
            <button
              type="button"
              onClick={abrirCriacao}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110"
            >
              <Plus className="size-4" aria-hidden />
              Novo setor
            </button>
          </header>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <label className="relative block w-full max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/60" aria-hidden />
              <input
                type="search"
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Buscar por nome ou sigla..."
                aria-label="Buscar setor"
                className="h-11 w-full rounded-lg border border-panel-active bg-background pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-brand"
              />
            </label>
            <p className="text-sm text-white/70">
              {filtrados.length} {filtrados.length === 1 ? "setor" : "setores"}
            </p>
          </div>

          {isPending ? (
            <p className="py-12 text-center text-sm text-white/80">Carregando setores...</p>
          ) : isError ? (
            <p className="py-12 text-center text-sm text-white/80">Não foi possível carregar os setores.</p>
          ) : filtrados.length === 0 ? (
            <p className="py-12 text-center text-sm text-white/80">Nenhum setor encontrado.</p>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-xl border border-panel-active">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-panel-active text-left text-xs font-semibold text-white/80">
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Sigla</th>
                    <th className="w-28 px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((setor) => (
                    <tr key={setor.id} className="border-b border-panel-active/60 text-white">
                      <td className="px-4 py-3">{setor.nome}</td>
                      <td className="px-4 py-3">{setor.sigla}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            aria-label={`Editar ${setor.nome}`}
                            onClick={() => abrirEdicao(setor)}
                            className="rounded-md p-1.5 text-white/80 transition hover:bg-panel-active hover:text-white"
                          >
                            <Pencil className="size-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            aria-label={`Excluir ${setor.nome}`}
                            onClick={() => excluir(setor)}
                            className="rounded-md p-1.5 text-destructive transition hover:bg-destructive/10"
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {dialogoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="presentation">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="setor-dialogo-titulo"
            onSubmit={salvar}
            className="relative w-full max-w-md rounded-2xl border border-panel-active bg-panel p-6 shadow-2xl"
          >
            <button
              type="button"
              aria-label="Fechar"
              onClick={fecharDialogo}
              className="absolute right-4 top-4 rounded-md p-1.5 text-white/80 transition hover:bg-panel-active hover:text-white"
            >
              <X className="size-5" aria-hidden />
            </button>
            <h2 id="setor-dialogo-titulo" className="font-display text-xl font-semibold text-white">
              {setorEmEdicao ? "Editar setor" : "Novo setor"}
            </h2>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-1.5 text-sm font-semibold text-white">
                Nome
                <input value={nome} onChange={(evento) => setNome(evento.target.value)} className={CAMPO} required />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-white">
                Sigla
                <input
                  value={sigla}
                  onChange={(evento) => setSigla(evento.target.value)}
                  maxLength={20}
                  className={CAMPO}
                  required
                />
              </label>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={fecharDialogo}
                className="rounded-lg border border-panel-active px-4 py-2 text-sm font-semibold text-white transition hover:bg-panel-active"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-slate-900 shadow transition hover:brightness-110 disabled:opacity-60"
              >
                {salvando ? "Salvando..." : setorEmEdicao ? "Salvar alterações" : "Cadastrar setor"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
