import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ImportarColaboradoresDialog } from "@/components/painel/importar-colaboradores-dialog";
import type { LinhaImportada } from "@/lib/importacao-colaboradores";
import { FileSpreadsheet, Plus, Search, UsersRound } from "lucide-react";

import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { CadastrarColaboradorDialog } from "@/components/painel/cadastrar-colaborador-dialog";
import { PerfilFlutuante } from "@/components/perfil-flutuante";

export const Route = createFileRoute("/cadastro-desligamento")({
  head: () => ({
    meta: [{ title: "Cadastro e Desligamento — Orcoma Orkomakers" }],
  }),
  component: CadastroDesligamentoPage,
});

const COLUNAS = ["Nome", "Cargo", "Setor", "Gestor Direto", "Unidade"];


function CadastroDesligamentoPage() {
  const [busca, setBusca] = useState("");
  const [cadastrarAberto, setCadastrarAberto] = useState(false);
  const [importarAberto, setImportarAberto] = useState(false);
  const [colaboradores, setColaboradores] = useState<LinhaImportada[]>([]);

  // Ignora quem já está na lista pelo mesmo ID, e-mail ou CPF (vale o que já estava cadastrado).
  function adicionarImportados(novas: LinhaImportada[]) {
    setColaboradores((atuais) => {
      const ids = new Set(atuais.map((item) => item.dados["ID"] ?? ""));
      const emails = new Set(atuais.map((item) => (item.dados["Email"] ?? "").toLowerCase()));
      const cpfs = new Set(atuais.map((item) => item.dados["CPF"] ?? "").filter(Boolean));
      const aceitas = novas.filter((linha) => {
        const cpf = linha.dados["CPF"] ?? "";
        if (ids.has(linha.dados["ID"] ?? "") || emails.has((linha.dados["Email"] ?? "").toLowerCase()) || (cpf && cpfs.has(cpf))) return false;
        ids.add(linha.dados["ID"] ?? "");
        emails.add((linha.dados["Email"] ?? "").toLowerCase());
        if (cpf) cpfs.add(cpf);
        return true;
      });
      return [...atuais, ...aceitas];
    });
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

          <label className="relative mt-6 block max-w-xl">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/60" aria-hidden />
            <input
              type="search"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por nome, setor, gestor ou unidade"
              aria-label="Buscar colaboradores"
              className="h-11 w-full rounded-lg border border-panel-active bg-background pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-brand"
            />
          </label>

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
                {colaboradores.length === 0 ? (
                  <tr>
                    <td colSpan={COLUNAS.length} className="py-12 text-center text-white/80">
                      <UsersRound className="mx-auto mb-3 size-10 text-brand" aria-hidden />
                      Nenhum colaborador cadastrado.
                    </td>
                  </tr>
                ) : (
                  colaboradores.map((linha) => (
                    <tr key={`${linha.dados["ID"] ?? ""}-${linha.dados["Email"] ?? ""}`} className="border-b border-panel-active/60 text-white">
                      <td className="px-4 py-3">{linha.nome}</td>
                      <td className="px-4 py-3">{linha.dados["Cargo Visível ( editável )"] || linha.dados["Cargo"] || "—"}</td>
                      <td className="px-4 py-3">{linha.setor || "—"}</td>
                      <td className="px-4 py-3">{linha.gestorDireto || "—"}</td>
                      <td className="px-4 py-3">{linha.unidade || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <ImportarColaboradoresDialog
        aberto={importarAberto}
        onFechar={() => setImportarAberto(false)}
        onImportar={adicionarImportados}
      />
      <CadastrarColaboradorDialog aberto={cadastrarAberto} onFechar={() => setCadastrarAberto(false)} />
    </div>
  );
}
