import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import {
  CardDetalhes,
  CardParticipantes,
  CardPerguntas,
} from "@/components/painel/pesquisa-pagina";
import { PainelSidebar } from "@/components/painel/painel-sidebar";
import { RelatorioTurnover } from "@/components/painel/relatorio-turnover";
import { PerfilFlutuante } from "@/components/perfil-flutuante";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const TITULO = "Pesquisa de Desligamento";
const EXEMPLO = "Ex.: Entrevista de saída";

export const Route = createFileRoute("/pesquisa-desligamento")({
  head: () => ({
    meta: [{ title: "Pesquisa de Desligamento — Orcoma Orkomakers" }],
  }),
  component: PesquisaDesligamentoPage,
});

function PesquisaDesligamentoPage() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <PainelSidebar />
      <main className="min-w-0 flex-1 px-10 pb-10 pt-24">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-white">{TITULO}</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/80">
              Conduza a entrevista de saída e entenda os motivos de desligamento.
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-brand px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand/10"
              >
                <Plus className="size-4" aria-hidden />
                Criar Pesquisa de Desligamento
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[94vw] 2xl:max-w-[1600px]">
              <DialogHeader>
                <DialogTitle>Criar Pesquisa de Desligamento</DialogTitle>
                <DialogDescription>
                  Defina os participantes, os detalhes e as perguntas da entrevista de saída.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <CardParticipantes nome={TITULO} />
                <CardDetalhes nome={TITULO} exemplo={EXEMPLO} />
                <CardPerguntas />
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <div className="mt-8">
          <RelatorioTurnover />
        </div>
      </main>
      <PerfilFlutuante />
    </div>
  );
}
