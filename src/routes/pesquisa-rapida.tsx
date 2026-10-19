import { createFileRoute } from "@tanstack/react-router";

import { PaginaPesquisa } from "@/components/painel/pesquisa-pagina";

export const Route = createFileRoute("/pesquisa-rapida")({
  head: () => ({
    meta: [{ title: "Pesquisa Rápida — Orcoma Orkomakers" }],
  }),
  component: PesquisaRapidaPage,
});

function PesquisaRapidaPage() {
  return (
    <PaginaPesquisa
      titulo="Pesquisa Rápida"
      descricao="Crie um pulso rápido com poucas perguntas e acompanhe a rotina do time."
      exemplo="Ex.: Pulso rápido da semana"
    />
  );
}
