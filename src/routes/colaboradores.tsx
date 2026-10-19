import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { PerfilFlutuante } from "@/components/perfil-flutuante";

export const Route = createFileRoute("/colaboradores")({
  head: () => ({
    meta: [{ title: "Colaboradores — Orcoma Orkomakers" }],
  }),
  component: ColaboradoresPage,
});

const TODOS = "todos";

// Sem dados por enquanto: os colaboradores e as opções de filtro chegam da fonte real depois.
const COLABORADORES: never[] = [];

const CAMPO =
  "h-10 w-full rounded-lg border border-panel-active bg-background px-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-brand";

function CampoFiltro({ id, rotulo, valor, onChange }: { id: string; rotulo: string; valor: string; onChange: (valor: string) => void }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-white">
        {rotulo}
      </label>
      <select id={id} value={valor} onChange={(evento) => onChange(evento.target.value)} className={CAMPO}>
        <option value={TODOS}>Todos</option>
      </select>
    </div>
  );
}

function ColaboradoresPage() {
  const [unidade, setUnidade] = useState(TODOS);
  const [departamento, setDepartamento] = useState(TODOS);
  const [papel, setPapel] = useState(TODOS);
  const [pesquisa, setPesquisa] = useState("");

  function limparFiltros() {
    setUnidade(TODOS);
    setDepartamento(TODOS);
    setPapel(TODOS);
    setPesquisa("");
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 space-y-6 px-10 pb-10 pt-24">
        <section className="rounded-2xl border border-panel-active bg-panel p-6">
          <h1 className="font-display text-3xl font-semibold text-white">Colaboradores</h1>
          <p className="mt-1 text-sm text-white/80">
            Aqui você pode encontrar a listagem de todos os colaboradores da sua empresa cadastrados, junto com suas
            informações.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CampoFiltro id="filtro-unidade" rotulo="Unidade" valor={unidade} onChange={setUnidade} />
            <CampoFiltro id="filtro-departamento" rotulo="Departamento" valor={departamento} onChange={setDepartamento} />
            <CampoFiltro id="filtro-papel" rotulo="Papéis" valor={papel} onChange={setPapel} />
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
          {COLABORADORES.length === 0 ? (
            <p className="py-12 text-center text-sm text-white/80">Nenhum colaborador encontrado.</p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
