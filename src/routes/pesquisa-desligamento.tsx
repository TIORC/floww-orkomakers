import { createFileRoute } from "@tanstack/react-router";

import { PaginaPesquisa } from "@/components/painel/pesquisa-pagina";

export const Route = createFileRoute("/pesquisa-desligamento")({
  head: () => ({
    meta: [{ title: "Pesquisa de Desligamento — Orcoma Orkomakers" }],
  }),
  component: PesquisaDesligamentoPage,
});

function PesquisaDesligamentoPage() {
  return (
    <PaginaPesquisa
      titulo="Pesquisa de Desligamento"
      descricao="Conduza a entrevista de saída e entenda os motivos de desligamento."
      exemplo="Ex.: Entrevista de saída"
    />
  );
}
